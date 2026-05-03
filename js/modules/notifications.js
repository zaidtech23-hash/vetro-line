// ═══════════════════════════════════════════════════════════════
// MÓDULO: NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════════════

const Notifications = {

  unreadCount: 0,
  pollInterval: null,
  lastNotificationId: null, // Pra detectar notificação NOVA
  soundEnabled: true,
  audioContext: null,

  async start() {
    await this.loadCount();
    await this.captureLatest(); // Salva qual é a última, sem tocar som ainda
    this.pollInterval = setInterval(() => this.checkNew(), 15000); // Check a cada 15s
  },

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  },

  // Captura o ID da última notificação atual (sem tocar som)
  async captureLatest() {
    try {
      const { data } = await sb
        .from('notifications')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        this.lastNotificationId = data[0].id;
      }
    } catch (e) {
      console.warn('Erro capturando última notif:', e);
    }
  },

  // Verifica se chegou notificação nova
  async checkNew() {
    try {
      const { data } = await sb
        .from('notifications')
        .select('id, title, message, type, read, related_id, related_type')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!data || data.length === 0) return;
      
      const newest = data[0];
      
      // Se mudou e não é nossa primeira vez = notificação nova!
      if (this.lastNotificationId && newest.id !== this.lastNotificationId && !newest.read) {
        this.lastNotificationId = newest.id;
        this.playNotificationSound();
        this.vibrate();
        await this.loadCount();
        
        // Tipo "new_os_assigned" = funcionário recebeu OS nova → modal grande
        if (newest.type === 'new_os_assigned' && APP_STATE.profile?.role === 'worker') {
          this.showNewOSModal(newest);
        } else {
          this.showInAppToast(newest.title);
        }
      } else if (newest.id !== this.lastNotificationId) {
        this.lastNotificationId = newest.id;
        await this.loadCount();
      }
    } catch (e) {
      console.warn('Erro checando novas:', e);
    }
  },
  
  // Modal GRANDE quando chega OS nova pro funcionário
  showNewOSModal(notif) {
    const modal = document.getElementById('newOSAlertModal');
    const titleEl = document.getElementById('newOSAlertTitle');
    const msgEl = document.getElementById('newOSAlertMsg');
    const btnVer = document.getElementById('newOSAlertVer');
    
    if (!modal) {
      // Fallback se modal não existir
      this.showInAppToast(notif.title);
      return;
    }
    
    titleEl.textContent = notif.title || '🆕 Novo Serviço!';
    msgEl.textContent = notif.message || 'O chefe acabou de te atribuir uma OS nova.';
    
    btnVer.onclick = async () => {
      // Marca como lida
      await sb.from('notifications').update({ read: true }).eq('id', notif.id);
      Utils.closeModal('newOSAlertModal');
      
      // Abre a OS direto
      if (notif.related_id) {
        setTimeout(() => {
          App.showScreen('minhas-os');
          setTimeout(() => {
            if (typeof MinhasOS !== 'undefined' && MinhasOS.openDetail) {
              MinhasOS.openDetail(notif.related_id);
            }
          }, 300);
        }, 200);
      }
    };
    
    Utils.openModal('newOSAlertModal');
  },

  // Toca som FORTE estilo WhatsApp (gerado, sem precisar de arquivo)
  playNotificationSound() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioContext;
      
      // Som tipo WhatsApp: "ti-tiim" (3 tons mais altos)
      const playTone = (freq, startTime, duration, volume = 0.6) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      // Sequência tipo notif do WhatsApp — 3 tons rápidos e fortes
      playTone(1100, now, 0.15, 0.6);            // Tom 1
      playTone(1500, now + 0.1, 0.15, 0.6);      // Tom 2
      playTone(1800, now + 0.2, 0.25, 0.7);      // Tom 3 (mais forte)
    } catch (e) {
      console.warn('Erro tocando som:', e);
    }
  },

  // Vibração FORTE (padrão de alerta)
  vibrate() {
    try {
      if ('vibrate' in navigator) {
        // Padrão: vibra forte, pausa, vibra forte, pausa, vibra forte
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    } catch (e) {
      console.warn('Erro vibrando:', e);
    }
  },

  // Toast visual quando chega notif nova
  showInAppToast(title) {
    Utils.toast(`🔔 ${title}`, 'info');
    // Faz o sino balançar
    const bell = document.getElementById('notifBell');
    if (bell) {
      bell.classList.add('shake');
      setTimeout(() => bell.classList.remove('shake'), 1000);
    }
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
    // Marca como lida
    await sb.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', id);
    await this.loadCount();

    Utils.closeModal('notifModal');

    // Aguarda um pouco pra modal fechar
    setTimeout(async () => {
      try {
        if (relatedType === 'service_order' && relatedId) {
          // Busca a OS completa
          const { data: os, error } = await sb
            .from('service_orders')
            .select('*, clients(*), profiles!service_orders_worker_id_fkey(name)')
            .eq('id', relatedId)
            .single();
          
          if (error || !os) {
            Utils.toast('OS não encontrada', 'error');
            return;
          }
          
          // Abre o detalhe certo conforme o role
          if (APP_STATE.profile?.role === 'worker') {
            // Worker abre o modal de "Minhas OS"
            App.showScreen('minhas-os');
            setTimeout(() => {
              if (typeof MinhasOS !== 'undefined' && MinhasOS.openDetail) {
                MinhasOS.openDetail(relatedId);
              }
            }, 300);
          } else {
            // Admin abre na tela de Ordens
            App.showScreen('ordens');
            setTimeout(() => {
              if (typeof Ordens !== 'undefined' && Ordens.openEdit) {
                Ordens.openEdit(relatedId);
              }
            }, 300);
          }
        } else if (relatedType === 'quote' && relatedId) {
          App.showScreen('orcamentos');
          setTimeout(() => {
            if (typeof Orcamentos !== 'undefined' && Orcamentos.openEdit) {
              Orcamentos.openEdit(relatedId);
            }
          }, 300);
        } else {
          // Sem relação específica, vai pra tela default
          if (relatedType) Utils.toast(`Notificação: ${relatedType}`, 'info');
        }
      } catch (e) {
        console.error('Erro abrindo detalhes:', e);
        Utils.toast('Erro abrindo detalhes', 'error');
      }
    }, 200);

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
    try {
      const payload = {
        organization_id: APP_STATE.organization.id,
        recipient_role: recipientRole,
        type,
        title,
        message,
        created_by: APP_STATE.user.id
      };
      
      // Só inclui se tiver valor
      if (relatedId) payload.related_id = relatedId;
      if (relatedType) payload.related_type = relatedType;
      
      const { error } = await sb.from('notifications').insert(payload);

      if (error) {
        console.error('Erro ao criar notificação:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception ao criar notificação:', err);
      return false;
    }
  }

};
