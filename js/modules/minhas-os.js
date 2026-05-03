// ═══════════════════════════════════════════════════════════════
// MÓDULO: MINHAS OS v4 (com notificações pro chefe)
// ═══════════════════════════════════════════════════════════════

const MinhasOS = {

  currentOS: null,

  async load() {
    await this.list();
  },

  async list() {
    const { data, error } = await sb
      .from('service_orders')
      .select('id, os_number, title, description, status, priority, due_date, photos, clients(name, address, city)')
      .order('due_date', { ascending: true });

    const container = document.getElementById('minhasOSList');

    if (error) {
      container.innerHTML = `<div class="text-center text-danger" style="padding: 40px;">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <div class="title">Nenhuma OS atribuída</div>
          <div class="sub">Quando o chefe te atribuir, vai aparecer aqui</div>
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
          <div class="detail-label">Atualizar Status</div>
          <div class="status-buttons">
            <button class="status-btn ${os.status === 'in_production' ? 'active' : ''}" onclick="MinhasOS.updateStatus('in_production')">🏭 Em produção</button>
            <button class="status-btn ${os.status === 'in_field' ? 'active' : ''}" onclick="MinhasOS.updateStatus('in_field')">🚚 Em campo</button>
          </div>
          <button class="btn-finish" onclick="MinhasOS.finishAndNotify()">
            ✅ Terminei — Avisar Chefe
          </button>
        </div>
      ` : `
        <div class="detail-section">
          <div class="info-banner" style="background: #06d6a015; border-color: #06d6a040; color: var(--secondary);">
            ✅ <strong>Serviço concluído!</strong> O chefe já foi notificado.
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
        <label class="upload-btn">
          📷 Tirar/Adicionar foto
          <input type="file" accept="image/*" capture="environment" onchange="MinhasOS.uploadPhoto(event)" style="display: none;">
        </label>
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

  async finishAndNotify() {
    if (!this.currentOS) return;
    
    if (!await Utils.confirm('Marcar como concluído e avisar o chefe?')) return;
    
    await this.updateStatus('done');
    
    setTimeout(() => {
      Utils.toast('✅ Chefe avisado! Bom trabalho! 💪', 'success');
    }, 800);
  },

  async updateStatus(newStatus) {
    if (!this.currentOS) return;

    const btn = event?.target;
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

    try {
      const { error } = await sb
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', this.currentOS.id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        Utils.toast('Erro: ' + (error.message || 'Não foi possível atualizar'), 'error');
        return;
      }

      Utils.toast(`✅ ${Utils.statusLabel(newStatus)}`);
      
      // NOTIFICAÇÃO PRO CHEFE (não bloqueia se der erro)
      try {
        if (newStatus === 'done') {
          await Notifications.create({
            recipientRole: 'admin',
            type: 'os_completed',
            title: `OS ${this.currentOS.os_number} concluída!`,
            message: `${APP_STATE.profile.name} marcou como concluído: ${this.currentOS.title}`,
            relatedId: this.currentOS.id,
            relatedType: 'service_order'
          });
        } else if (newStatus === 'in_field') {
          await Notifications.create({
            recipientRole: 'admin',
            type: 'os_started',
            title: `OS ${this.currentOS.os_number} em campo`,
            message: `${APP_STATE.profile.name} saiu pra fazer: ${this.currentOS.title}`,
            relatedId: this.currentOS.id,
            relatedType: 'service_order'
          });
        } else if (newStatus === 'in_production') {
          await Notifications.create({
            recipientRole: 'admin',
            type: 'os_production',
            title: `OS ${this.currentOS.os_number} em produção`,
            message: `${APP_STATE.profile.name} começou: ${this.currentOS.title}`,
            relatedId: this.currentOS.id,
            relatedType: 'service_order'
          });
        }
      } catch (notifErr) {
        console.warn('Notificação não foi criada:', notifErr);
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
