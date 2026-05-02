// ═══════════════════════════════════════════════════════════════
// MÓDULO: NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════════════

const Notifications = {

  unreadCount: 0,
  pollInterval: null,

  async start() {
    await this.loadCount();
    this.pollInterval = setInterval(() => this.loadCount(), 30000);
  },

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  },

  async loadCount() {
    const { count, error } = await sb
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      console.error('Erro nas notificações:', error);
      return;
    }

    this.unreadCount = count || 0;
    this.updateBadge();
  },

  updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  async openPanel() {
    Utils.openModal('notifModal');
    await this.loadList();
  },

  async loadList() {
    const { data, error } = await sb
      .from('notifications')
      .select('*, created_by_profile:profiles!notifications_created_by_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(30);

    const container = document.getElementById('notifList');

    if (error) {
      container.innerHTML = `<div class="text-center text-danger" style="padding: 20px;">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔔</div>
          <div class="title">Nenhuma notificação</div>
          <div class="sub">Quando algo acontecer, vai aparecer aqui</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(n => {
      const icon = this.iconForType(n.type);
      const timeAgo = this.timeAgo(n.created_at);
      const fromName = n.created_by_profile?.name || '';

      return `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifications.handleClick('${n.id}', '${n.related_type || ''}', '${n.related_id || ''}')">
          <div class="notif-icon">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            ${n.message ? `<div class="notif-message">${n.message}</div>` : ''}
            <div class="notif-meta">
              ${fromName ? `Por ${fromName} · ` : ''}${timeAgo}
            </div>
          </div>
          ${!n.read ? '<div class="notif-dot"></div>' : ''}
        </div>
      `;
    }).join('');
  },

  iconForType(type) {
    const icons = {
      'photo_uploaded': '📸',
      'os_completed': '✅',
      'os_started': '🚚',
      'quote_created': '💰',
      'cut_done': '✂️',
      'low_stock': '⚠️'
    };
    return icons[type] || '🔔';
  },

  timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHour < 24) return `há ${diffHour}h`;
    if (diffDay < 7) return `há ${diffDay}d`;
    return Utils.formatDate(dateStr.split('T')[0]);
  },

  async handleClick(id, relatedType, relatedId) {
    await sb.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', id);
    await this.loadCount();

    Utils.closeModal('notifModal');

    if (relatedType === 'service_order' && relatedId) {
      App.showScreen('ordens');
    } else if (relatedType === 'quote' && relatedId) {
      App.showScreen('orcamentos');
    }

    setTimeout(() => this.loadList(), 100);
  },

  async markAllRead() {
    await sb
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('read', false);
    
    Utils.toast('✅ Todas marcadas como lidas');
    await this.loadCount();
    await this.loadList();
  },

  async create({ recipientRole = 'admin', type, title, message, relatedId = null, relatedType = null }) {
    const { error } = await sb.from('notifications').insert({
      organization_id: APP_STATE.organization.id,
      recipient_role: recipientRole,
      type,
      title,
      message,
      related_id: relatedId,
      related_type: relatedType,
      created_by: APP_STATE.user.id
    });

    if (error) console.error('Erro ao criar notificação:', error);
  }

};
