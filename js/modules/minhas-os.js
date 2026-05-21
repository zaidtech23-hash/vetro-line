// ═══════════════════════════════════════════════════════════════
// MÓDULO: MINHAS OS v4 (com notificações pro chefe)
// ═══════════════════════════════════════════════════════════════

const MinhasOS = {

  currentOS: null,

  async load() {
    await this.list();
  },

  async list() {
    // Filtra: só mostra OS pendente, em produção, em campo (ATIVAS)
    // Concluídas e canceladas vão pro Histórico
    const { data, error } = await sb
      .from('service_orders')
      .select('id, os_number, title, description, status, priority, due_date, photos, clients(name, address, city)')
      .in('status', ['pending', 'in_production', 'in_field'])
      .order('due_date', { ascending: true });

    const container = document.getElementById('minhasOSList');

    if (error) {
      container.innerHTML = `<div class="text-center text-danger" style="padding: 40px;">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🎉</div>
          <div class="title">Nenhum serviço pendente!</div>
          <div class="sub">Tu tá em dia. Veja o histórico no menu pra ver os concluídos.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(os => {
      const photos = os.photos || [];
      const photosCount = photos.length;

      return `
        <div class="os-mobile-card" onclick="MinhasOS.openDetail('${os.id}')">
          <div class="os-mobile-head">
            <div>
              <div class="os-mobile-number">${os.os_number || 'OS'}</div>
              <div class="os-mobile-title">${os.title}</div>
            </div>
            <div class="tag ${os.status}">${Utils.statusLabel(os.status)}</div>
          </div>
          <div class="os-mobile-info">
            ${os.clients?.name ? `<div>👤 ${os.clients.name}</div>` : ''}
            ${os.clients?.address ? `<div>📍 ${os.clients.address}${os.clients.city ? ' — ' + os.clients.city : ''}</div>` : ''}
            ${os.due_date ? `<div>📅 ${Utils.formatDate(os.due_date)}</div>` : ''}
            ${photosCount > 0 ? `<div>📸 ${photosCount} foto(s)</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  async openDetail(osId) {
    const { data, error } = await sb
      .from('service_orders')
      .select('*, clients(name, address, city)')
      .eq('id', osId)
      .single();

    if (error) {
      Utils.toast('Erro ao carregar OS', 'error');
      return;
    }

    this.currentOS = data;
    this.renderDetail();
    Utils.openModal('osDetailModal');
    await Cortes.loadForOS(osId);
  },

  renderDetail() {
    const os = this.currentOS;
    const photos = os.photos || [];
    const c = os.clients || {};

    document.getElementById('osDetailTitle').textContent = `${os.os_number || 'OS'} — ${os.title}`;

    const body = document.getElementById('osDetailBody');
    body.innerHTML = `
      <div class="detail-section">
        <div class="detail-label">Cliente</div>
        <div class="detail-value">${c.name || '—'}</div>
      </div>

      ${c.address ? `
        <div class="detail-section">
          <div class="detail-label">📍 Endereço</div>
          <div class="detail-value">
            ${c.address}${c.city ? '<br>' + c.city : ''}
            <br>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ' ' + (c.city || ''))}"
               target="_blank"
               style="color: var(--secondary); font-size: 0.8rem; margin-top: 8px; display: inline-block;">
              🗺️ Abrir no Google Maps
            </a>
          </div>
        </div>
      ` : ''}

      ${os.due_date ? `
        <div class="detail-section">
          <div class="detail-label">📅 Vencimento</div>
          <div class="detail-value">${Utils.formatDate(os.due_date)}</div>
        </div>
      ` : ''}

      ${os.description ? `
        <div class="detail-section">
          <div class="detail-label">📝 Descrição</div>
          <div class="detail-value">${os.description}</div>
        </div>
      ` : ''}

      <div class="detail-section">
        <div class="detail-label">Status atual</div>
        <div class="detail-value">
          <span class="tag ${os.status}">${Utils.statusLabel(os.status)}</span>
        </div>
      </div>

      ${os.status !== 'done' ? `
        <div class="detail-section">
          <div class="detail-label">📍 Etapa atual: <strong style="color: var(--primary);">${Utils.statusLabel(os.status)}</strong></div>
          <div class="step-flow">
            <div class="step ${['in_production','in_field','done'].includes(os.status) ? 'completed' : os.status === 'pending' ? 'current' : ''}">
              <div class="step-icon">🏭</div>
              <div class="step-label">Produção</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step ${['in_field','done'].includes(os.status) ? 'completed' : os.status === 'in_production' ? 'current' : ''}">
              <div class="step-icon">🚚</div>
              <div class="step-label">Em campo</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step ${os.status === 'done' ? 'completed' : os.status === 'in_field' ? 'current' : ''}">
              <div class="step-icon">✅</div>
              <div class="step-label">Concluído</div>
            </div>
          </div>
          
          <div class="step-action">
            ${os.status === 'pending' ? `
              <button class="btn-step-next" onclick="MinhasOS.advanceStep('in_production')">
                ▶️ Iniciar Produção
              </button>
              <p class="step-hint">Comece a produzir as peças no atelier</p>
            ` : os.status === 'in_production' ? `
              <button class="btn-step-next" onclick="MinhasOS.advanceStep('in_field')">
                🚚 Sair pra Obra
              </button>
              <p class="step-hint">Quando sair pra casa do cliente</p>
            ` : os.status === 'in_field' ? `
              <button class="btn-finish" onclick="MinhasOS.finishAndNotify()">
                ✅ Terminei — Avisar Chefe
              </button>
              <p class="step-hint">Quando finalizar o serviço no cliente</p>
            ` : ''}
          </div>
        </div>
      ` : `
        <div class="detail-section">
          <div class="info-banner" style="background: #06d6a015; border-color: #06d6a040; color: var(--secondary); text-align: center; padding: 16px;">
            ✅ <strong>Serviço concluído!</strong><br>
            <span style="font-size: 0.85rem; color: var(--text-dim);">O chefe já foi notificado.</span>
          </div>
        </div>
      `}

      <div class="detail-section">
        <div class="detail-label">✂️ Cortes de Alumínio</div>
        <div id="cutsList"><div class="loading">Carregando...</div></div>
      </div>

      <div class="detail-section">
        <div class="detail-label">📸 Fotos do serviço</div>
        <div class="photos-grid" id="photosGrid">
          ${photos.length === 0
            ? '<div class="text-muted text-center" style="padding: 20px; grid-column: 1/-1;">Nenhuma foto ainda</div>'
            : photos.map((url, idx) => `
                <div class="photo-thumb">
                  <img src="${url}" alt="Foto ${idx+1}" onclick="window.open('${url}', '_blank')">
                  <button class="photo-delete" onclick="MinhasOS.deletePhoto(${idx})" title="Apagar">×</button>
                </div>
              `).join('')
          }
        </div>
        <button type="button" class="upload-btn" onclick="Camera.open(MinhasOS.uploadPhoto.bind(MinhasOS))">
          📷 Tirar Foto
        </button>
      </div>

      <div class="detail-section">
        <div class="detail-label">💰 Orçamento na casa do cliente</div>
        <p style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 12px;">
          Use isso pra criar orçamento rápido enquanto está com o cliente.
        </p>
        <button class="btn-primary" style="width: 100%;" onclick="MinhasOS.openQuickQuote()">
          ⚡ Fazer Orçamento Rápido
        </button>
      </div>

      ${os.notes ? `
        <div class="detail-section">
          <div class="detail-label">📋 Observações</div>
          <div class="detail-value">${os.notes}</div>
        </div>
      ` : ''}
    `;
  },

  // Avança 1 etapa (Pendente → Produção → Em campo)
  async advanceStep(newStatus) {
    if (!this.currentOS) return;
    
    const config = {
      'in_production': {
        title: 'Iniciar Produção?',
        icon: '🏭',
        message: `OS: ${this.currentOS.title}\n\nVai começar a produzir as peças no atelier.`,
        okText: '▶️ Sim, iniciar'
      },
      'in_field': {
        title: 'Sair pra Obra?',
        icon: '🚚',
        message: `OS: ${this.currentOS.title}\n\nO chefe vai ser avisado que tu tá indo pra casa do cliente.`,
        okText: '🚚 Sim, sair'
      }
    };
    
    const opts = config[newStatus] || { title: 'Avançar etapa?' };
    if (!await Utils.confirm(opts.message || 'Avançar etapa?', opts)) return;
    
    await this.updateStatus(newStatus, true); // true = mostrar toast com som
  },

  async finishAndNotify() {
    if (!this.currentOS) return;
    
    const ok = await Utils.confirm(
      `OS: ${this.currentOS.title}\n\nTem certeza que TERMINOU o serviço? O chefe vai ser avisado.`,
      {
        title: 'Concluir Serviço?',
        icon: '✅',
        okText: '🎉 Sim, terminei!',
        cancelText: 'Ainda não'
      }
    );
    if (!ok) return;
    
    const osTerminada = this.currentOS;
    
    await this.updateStatus('done', true);
    
    // Espera um pouco e procura próxima OS pra abrir
    setTimeout(async () => {
      Utils.toast('✅ Chefe avisado! Bom trabalho! 💪', 'success');
      
      // Procura próxima OS pendente do funcionário
      try {
        const { data: proximaOS } = await sb
          .from('service_orders')
          .select('*, clients(*)')
          .eq('worker_id', APP_STATE.user.id)
          .neq('id', osTerminada.id)
          .neq('status', 'done')
          .neq('status', 'cancelled')
          .order('due_date', { ascending: true })
          .limit(1);
        
        if (proximaOS && proximaOS.length > 0) {
          // Tem próxima OS — fecha atual, abre nova
          setTimeout(() => {
            Utils.closeModal('osDetailModal');
            setTimeout(() => {
              Utils.toast(`📋 Próxima OS: ${proximaOS[0].title}`, 'info');
              this.openDetail(proximaOS[0].id);
            }, 600);
          }, 1500);
        } else {
          // Não tem mais OS — só fecha
          setTimeout(() => {
            Utils.closeModal('osDetailModal');
            Utils.toast('🎉 Você terminou todas suas OS!', 'success');
            this.list();
          }, 1500);
        }
      } catch (err) {
        console.warn('Erro buscando próxima OS:', err);
        Utils.closeModal('osDetailModal');
        this.list();
      }
    }, 800);
  },

  async updateStatus(newStatus, withFeedback = false) {
    if (!this.currentOS) return;

    try {
      // Garante que a sessão tá válida antes de salvar (renova se preciso)
      await Auth.ensureSession();

      // 1) Atualiza status na OS
      const { error } = await sb
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', this.currentOS.id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        Utils.toast('Erro: ' + (error.message || 'Não foi possível atualizar'), 'error');
        return;
      }

      // 2) NOTIFICAÇÃO PRO CHEFE (Em campo + Concluído)
      // Tenta até 3x se falhar (pra resolver problemas de rede intermitentes)
      const notifConfig = {
        'done': {
          type: 'os_completed',
          title: `🎉 OS ${this.currentOS.os_number || ''} CONCLUÍDA!`,
          message: `${APP_STATE.profile.name} terminou: ${this.currentOS.title}`
        },
        'in_field': {
          type: 'os_started',
          title: `🚚 ${APP_STATE.profile.name} saiu pra obra!`,
          message: `OS ${this.currentOS.os_number || ''}: ${this.currentOS.title}`
        }
      };

      if (notifConfig[newStatus]) {
        let notifOk = false;
        const cfg = notifConfig[newStatus];

        for (let tentativa = 1; tentativa <= 3 && !notifOk; tentativa++) {
          try {
            notifOk = await Notifications.create({
              recipientRole: 'admin',
              type: cfg.type,
              title: cfg.title,
              message: cfg.message,
              relatedId: this.currentOS.id,
              relatedType: 'service_order'
            });
          } catch (err) {
            console.warn(`Tentativa ${tentativa} de notificar falhou:`, err);
          }
          if (!notifOk && tentativa < 3) {
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (notifOk) {
          Utils.toast(`✅ ${Utils.statusLabel(newStatus)} — Chefe avisado!`, 'success');
        } else {
          Utils.toast(`⚠️ ${Utils.statusLabel(newStatus)} salvo, mas falhou ao avisar o chefe. Tenta de novo!`, 'error');
        }
      } else {
        // in_production / outros: só mostra status atualizado, sem mandar notif
        Utils.toast(`✅ ${Utils.statusLabel(newStatus)}`);
      }

      this.currentOS.status = newStatus;
      this.renderDetail();
      await Cortes.loadForOS(this.currentOS.id);
      await this.list();
    } catch (err) {
      console.error(err);
      Utils.toast('Erro inesperado: ' + err.message, 'error');
    }
  },

  async uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!this.currentOS) return;

    Utils.toast('Enviando foto...', 'info');

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${this.currentOS.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('os-photos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = sb.storage.from('os-photos').getPublicUrl(fileName);
      const photoUrl = urlData.publicUrl;
      const photos = this.currentOS.photos || [];
      photos.push(photoUrl);

      const { error: updateError } = await sb
        .from('service_orders')
        .update({ photos: photos })
        .eq('id', this.currentOS.id);
      if (updateError) throw updateError;

      Utils.toast('✅ Foto enviada!');
      
      // NOTIFICAÇÃO PRO CHEFE
      await Notifications.create({
        recipientRole: 'admin',
        type: 'photo_uploaded',
        title: `📸 Nova foto de ${APP_STATE.profile.name}`,
        message: `OS ${this.currentOS.os_number} - ${this.currentOS.title}`,
        relatedId: this.currentOS.id,
        relatedType: 'service_order'
      });

      this.currentOS.photos = photos;
      this.renderDetail();
      await Cortes.loadForOS(this.currentOS.id);

    } catch (err) {
      Utils.toast('Erro: ' + err.message, 'error');
    }
  },

  async deletePhoto(index) {
    if (!await Utils.confirm('Apagar essa foto?')) return;
    const photos = [...(this.currentOS.photos || [])];
    photos.splice(index, 1);

    const { error } = await sb
      .from('service_orders')
      .update({ photos: photos })
      .eq('id', this.currentOS.id);

    if (error) { Utils.toast('Erro', 'error'); return; }

    this.currentOS.photos = photos;
    Utils.toast('Foto removida');
    this.renderDetail();
    await Cortes.loadForOS(this.currentOS.id);
  },

  qqPhotos: [],

  openQuickQuote() {
    Utils.closeModal('osDetailModal');
    Utils.clearForm('quickQuoteForm');
    
    // Pré-preenche com dados do cliente da OS
    const client = this.currentOS.clients;
    if (client) {
      document.getElementById('qq_client_name_input').value = client.name || '';
      document.getElementById('qq_client_phone').value = client.phone || '';
      document.getElementById('qq_client_address').value = client.address || '';
    }
    
    // Limpa fotos
    this.qqPhotos = [];
    document.getElementById('qq_photos').innerHTML = '';
    
    Utils.openModal('quickQuoteModal');
  },

  async uploadQQPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    Utils.toast('Enviando foto...', 'info');

    try {
      const ext = file.name.split('.').pop();
      const fileName = `quotes/${Date.now()}.${ext}`;

      // Tenta no quote-photos primeiro
      const { error: uploadError } = await sb.storage
        .from('quote-photos')
        .upload(fileName, file);
      
      if (uploadError) {
        // Fallback: os-photos
        const { error: fallbackError } = await sb.storage
          .from('os-photos')
          .upload(fileName, file);
        if (fallbackError) throw fallbackError;
        const { data: urlData } = sb.storage.from('os-photos').getPublicUrl(fileName);
        this.qqPhotos.push(urlData.publicUrl);
      } else {
        const { data: urlData } = sb.storage.from('quote-photos').getPublicUrl(fileName);
        this.qqPhotos.push(urlData.publicUrl);
      }

      this.renderQQPhotos();
      Utils.toast('✅ Foto adicionada!');
    } catch (err) {
      Utils.toast('Erro: ' + err.message, 'error');
    }
  },

  renderQQPhotos() {
    const container = document.getElementById('qq_photos');
    if (!container) return;
    container.innerHTML = this.qqPhotos.map((url, idx) => `
      <div class="photo-thumb">
        <img src="${url}" alt="Foto ${idx+1}" onclick="window.open('${url}', '_blank')">
        <button class="photo-delete" onclick="MinhasOS.removeQQPhoto(${idx})">×</button>
      </div>
    `).join('');
  },

  removeQQPhoto(idx) {
    this.qqPhotos.splice(idx, 1);
    this.renderQQPhotos();
  },

  async saveQuickQuote() {
    const clientName = document.getElementById('qq_client_name_input').value.trim();
    const clientPhone = document.getElementById('qq_client_phone').value.trim();
    const clientAddress = document.getElementById('qq_client_address').value.trim();
    const serviceType = document.getElementById('qq_service_type').value.trim();
    const measurements = document.getElementById('qq_measurements').value.trim();
    const notes = document.getElementById('qq_notes').value.trim();

    if (!clientName) { Utils.toast('Nome do cliente é obrigatório', 'error'); return; }
    if (!serviceType) { Utils.toast('Tipo de serviço é obrigatório', 'error'); return; }

    const btn = document.getElementById('qqSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const payload = {
        organization_id: APP_STATE.organization.id,
        quote_number: Utils.generateQuoteNumber(),
        client_id: this.currentOS.client_id || null,
        client_name_temp: clientName,
        client_phone_temp: clientPhone,
        client_address_temp: clientAddress,
        service_type: serviceType,
        measurements: measurements,
        notes: notes,
        photos: this.qqPhotos,
        status: 'pending_review',
        created_by_role: 'worker',
        subtotal: 0,
        labor_cost: 0,
        discount: 0,
        total: 0
      };

      const { data: quote, error } = await sb.from('quotes').insert(payload).select().single();
      if (error) throw error;

      // NOTIFICAÇÃO PRO CHEFE
      await Notifications.create({
        recipientRole: 'admin',
        type: 'quote_created',
        title: `💰 Novo orçamento de ${APP_STATE.profile.name}`,
        message: `${clientName} - ${serviceType}`,
        relatedId: quote.id,
        relatedType: 'quote'
      });

      Utils.toast('✅ Orçamento enviado pro chefe! Ele vai revisar e te avisar.', 'success');
      Utils.closeModal('quickQuoteModal');
      this.openDetail(this.currentOS.id);
    } catch (err) {
      Utils.toast('Erro: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Enviar pro Chefe';
    }
  }

};
