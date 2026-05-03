// ═══════════════════════════════════════════════════════════════
// VETROLINE — APLICAÇÃO PRINCIPAL v7
// ═══════════════════════════════════════════════════════════════
// Funcionário NÃO vê Clientes (tirado)
// Botão Sair arrumado pro mobile
// ═══════════════════════════════════════════════════════════════

const App = {

  PERMISSIONS: {
    admin:   ['dashboard','agenda','historico','ordens','orcamentos','clientes','produtos','estoque','financeiro','funcionarios','configuracoes'],
    manager: ['dashboard','agenda','historico','ordens','orcamentos','clientes','produtos','estoque','financeiro','funcionarios','configuracoes'],
    worker:  ['minhas-os','agenda','historico','orcamentos','estoque']
  },

  canAccess(screen) {
    const role = APP_STATE.profile?.role || 'worker';
    return this.PERMISSIONS[role]?.includes(screen) || false;
  },

  isAdmin() {
    return ['admin', 'manager'].includes(APP_STATE.profile?.role);
  },

  isWorker() {
    return APP_STATE.profile?.role === 'worker';
  },

  async init() {
    const user = await Auth.checkSession();
    if (user) {
      try {
        APP_STATE.user = user;
        await Auth.loadProfile(user.id);
        this.showApp();
        const initialScreen = this.isAdmin() ? 'dashboard' : 'minhas-os';
        await this.showScreen(initialScreen);
        Notifications.start();
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  },

  async login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btnLogin');
    const msg = document.getElementById('message');

    if (!email || !password) {
      this.showMessage('Preenche email e senha', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';
    msg.style.display = 'none';

    try {
      const user = await Auth.login(email, password);
      APP_STATE.user = user;
      await Auth.loadProfile(user.id);
      this.showApp();
      const initialScreen = this.isAdmin() ? 'dashboard' : 'minhas-os';
      await this.showScreen(initialScreen);
      Notifications.start();
    } catch (err) {
      this.showMessage('Erro: ' + (err.message || 'Não foi possível entrar'), 'error');
      btn.disabled = false;
      btn.textContent = 'Entrar no Sistema →';
    }
  },

  async logout() {
    if (!confirm('Sair do sistema?')) return;
    Notifications.stop();
    await Auth.logout();
  },

  showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').classList.remove('active');
  },

  showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
    document.getElementById('topUserName').textContent = APP_STATE.profile.name;
    document.getElementById('topUserOrg').textContent = APP_STATE.organization.name;
    
    const bell = document.getElementById('notifBell');
    if (bell) {
      bell.style.display = 'flex'; // Sino pra TODOS (admin e worker)
    }
    
    this.applyPermissions();
  },

  applyPermissions() {
    const role = APP_STATE.profile.role;
    const allowed = this.PERMISSIONS[role] || [];

    document.querySelectorAll('.sidebar-item').forEach(item => {
      const screen = item.dataset.screen;
      if (screen && !allowed.includes(screen)) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
      }
    });

    document.querySelectorAll('.sidebar-section').forEach(section => {
      let cur = section.nextElementSibling;
      let hasVisible = false;
      while (cur && !cur.classList.contains('sidebar-section')) {
        if (cur.style.display !== 'none') { hasVisible = true; break; }
        cur = cur.nextElementSibling;
      }
      section.style.display = hasVisible ? '' : 'none';
    });
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
  },

  async showScreen(screenId) {
    if (!this.canAccess(screenId)) {
      Utils.toast('Sem permissão pra acessar', 'error');
      return;
    }

    APP_STATE.currentScreen = screenId;
    this.closeSidebar();

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(t => t.classList.remove('active'));

    const screen = document.getElementById('screen-' + screenId);
    if (screen) screen.classList.add('active');

    const item = document.querySelector(`.sidebar-item[data-screen="${screenId}"]`);
    if (item) item.classList.add('active');

    try {
      switch (screenId) {
        case 'dashboard': await Dashboard.load(); break;
        case 'agenda': await Agenda.load(); break;
        case 'ordens': await Ordens.load(); break;
        case 'orcamentos': await Orcamentos.load(); break;
        case 'clientes': await Clientes.load(); break;
        case 'produtos': await Produtos.load(); break;
        case 'estoque': await Estoque.load(); break;
        case 'financeiro': await Financeiro.load(); break;
        case 'funcionarios': await Funcionarios.load(); break;
        case 'configuracoes': await Configuracoes.load(); break;
        case 'minhas-os': await MinhasOS.load(); break;
        case 'historico': await Historico.list(); break;
      }
      
      // Mostra botões certos no estoque
      if (screenId === 'estoque') {
        const btnEntrada = document.getElementById('btnEntradaEstoque');
        const btnNovoItem = document.getElementById('btnNovoItem');
        if (this.isWorker()) {
          if (btnEntrada) btnEntrada.style.display = '';
          if (btnNovoItem) btnNovoItem.style.display = 'none';
        } else {
          if (btnEntrada) btnEntrada.style.display = 'none';
          if (btnNovoItem) btnNovoItem.style.display = '';
        }
      }
      
    } catch (err) {
      console.error('Erro ao carregar tela:', err);
      Utils.toast('Erro ao carregar dados', 'error');
    }
  },

  showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = 'message ' + type;
  }

};

window.addEventListener('DOMContentLoaded', () => {
  const pwd = document.getElementById('password');
  if (pwd) pwd.addEventListener('keypress', (e) => { if (e.key === 'Enter') App.login(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      App.closeSidebar();
    }
  });

  App.init();
});
