// ═══════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════════
// Gerencia login, logout, e carregamento do perfil do usuário.
// ═══════════════════════════════════════════════════════════════

const Auth = {

  // LOGIN
  async login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // LOGOUT
  async logout() {
    await sb.auth.signOut();
    APP_STATE.user = null;
    APP_STATE.profile = null;
    APP_STATE.organization = null;
    location.reload(); // Recarrega a página pra limpar tudo
  },

  // VERIFICA SE TEM SESSÃO ATIVA
  async checkSession() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  },

  // GARANTE QUE A SESSÃO TÁ VÁLIDA (renova se precisar)
  // Chama isso antes de operações importantes
  async ensureSession() {
    try {
      const { data: sessionData } = await sb.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        console.warn('Sem sessão — tentando renovar...');
        const { data: refreshed, error } = await sb.auth.refreshSession();
        if (error || !refreshed?.session) {
          console.error('Falha ao renovar sessão:', error);
          return false;
        }
        return true;
      }

      // Se a sessão expira em menos de 60s, renova já
      const expiresIn = (session.expires_at * 1000) - Date.now();
      if (expiresIn < 60_000) {
        const { data: refreshed, error } = await sb.auth.refreshSession();
        if (error || !refreshed?.session) {
          console.warn('Renovação automática falhou:', error);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Erro em ensureSession:', err);
      return false;
    }
  },

  // CARREGA PERFIL COMPLETO (profile + organization)
  async loadProfile(userId) {
    const { data, error } = await sb
      .from('profiles')
      .select('id, name, role, phone, organizations(id, name, cnpj, plan, phone, address, city, state)')
      .eq('id', userId)
      .single();

    if (error) throw error;

    APP_STATE.profile = {
      id: data.id,
      name: data.name,
      role: data.role,
      phone: data.phone
    };
    APP_STATE.organization = data.organizations;

    return data;
  },

  // PEGA INICIAIS DO NOME (pra avatar)
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  // LABEL AMIGÁVEL DE ROLE
  roleLabel(role) {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      worker: 'Funcionário'
    };
    return labels[role] || role;
  }

};
