// ═══════════════════════════════════════════════════════════════
// HELPERS / UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════

const Utils = {

  // FORMATA NÚMERO COMO DINHEIRO BRASILEIRO
  money(value) {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // FORMATA DATA: 2026-05-02 → 02/05/2026
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  },

  // FORMATA DATA + HORA
  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  },

  // DATA POR EXTENSO: Segunda-feira, 02 de Maio de 2026
  formatDateLong(date = new Date()) {
    const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  },

  // STATUS DE OS EM PORTUGUÊS
  statusLabel(status) {
    const labels = {
      pending: 'Pendente',
      in_production: 'Em produção',
      in_field: 'Em campo',
      done: 'Concluído',
      canceled: 'Cancelado'
    };
    return labels[status] || status;
  },

  // STATUS DE ORÇAMENTO
  quoteStatusLabel(status) {
    const labels = {
      draft: 'Rascunho',
      sent: 'Enviado',
      accepted: 'Aceito',
      rejected: 'Rejeitado',
      converted: 'Convertido em OS'
    };
    return labels[status] || status;
  },

  // PRIORIDADE EM PORTUGUÊS
  priorityLabel(priority) {
    const labels = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority] || priority;
  },

  // GERA NÚMERO DE OS (OS-2026-001)
  generateOSNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999) + 1;
    return `OS-${year}-${String(random).padStart(3, '0')}`;
  },

  // GERA NÚMERO DE ORÇAMENTO
  generateQuoteNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999) + 1;
    return `ORC-${year}-${String(random).padStart(3, '0')}`;
  },

  // MOSTRA TOAST (notificação rápida)
  toast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        z-index: 3000;
        box-shadow: 0 8px 24px #00000060;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      `;
      document.body.appendChild(toast);
    }
    
    const colors = {
      success: { bg: '#06d6a0', text: '#060910' },
      error: { bg: '#ef476f', text: '#fff' },
      info: { bg: '#00c9ff', text: '#060910' }
    };
    
    const c = colors[type] || colors.success;
    toast.style.background = c.bg;
    toast.style.color = c.text;
    toast.textContent = message;
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 3000);
  },

  // CONFIRMA AÇÃO COM MODAL CUSTOMIZADO (mais bonito que o nativo)
  async confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar ação',
        icon = '⚠️',
        okText = 'Sim, confirmar',
        cancelText = 'Cancelar',
        type = 'warning' // warning, danger, info
      } = typeof options === 'string' ? { title: options } : options;
      
      // Cria modal se não existir
      let modal = document.getElementById('customConfirmModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'customConfirmModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal confirm-modal">
            <div class="modal-body" style="padding: 32px 20px;">
              <div class="confirm-icon" id="confirmIcon">⚠️</div>
              <div class="confirm-title" id="confirmTitle">Confirmar?</div>
              <div class="confirm-message" id="confirmMessage"></div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" id="confirmCancelBtn">Cancelar</button>
              <button class="btn-primary" id="confirmOkBtn">Confirmar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      
      // Atualiza conteúdo
      document.getElementById('confirmIcon').textContent = icon;
      document.getElementById('confirmTitle').textContent = title;
      document.getElementById('confirmMessage').textContent = message;
      document.getElementById('confirmCancelBtn').textContent = cancelText;
      const okBtn = document.getElementById('confirmOkBtn');
      okBtn.textContent = okText;
      
      // Cor do botão OK conforme tipo
      if (type === 'danger') {
        okBtn.style.background = 'linear-gradient(135deg, #ef476f, #d63354)';
      } else {
        okBtn.style.background = '';
      }
      
      // Mostra modal
      modal.classList.add('active');
      
      // Handler dos botões (substitui sempre pra evitar múltiplos listeners)
      const cleanup = () => {
        modal.classList.remove('active');
        okBtn.onclick = null;
        document.getElementById('confirmCancelBtn').onclick = null;
      };
      
      okBtn.onclick = () => { cleanup(); resolve(true); };
      document.getElementById('confirmCancelBtn').onclick = () => { cleanup(); resolve(false); };
    });
  },

  // ABRE MODAL
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  },

  // FECHA MODAL
  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  },

  // LIMPA FORMULÁRIO DENTRO DE UM ELEMENTO
  clearForm(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });
  }

};
