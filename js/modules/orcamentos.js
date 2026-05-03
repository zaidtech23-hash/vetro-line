// ═══════════════════════════════════════════════════════════════
// MÓDULO: ORÇAMENTOS v7
// ═══════════════════════════════════════════════════════════════
// Funcionário: cria sem valores (só dados do cliente, foto, medidas)
// Admin: vê tudo, define valores, aprova/rejeita
// ═══════════════════════════════════════════════════════════════

const Orcamentos = {

  editingId: null,
  currentQuote: null,

  async load() {
    if (App.isWorker()) {
      await this.listWorker();
    } else {
      await this.list();
    }
    await this.loadClientsList();
  },

  async loadClientsList() {
    const { data: clients } = await sb.from('clients').select('id, name').order('name');
    const select = document.getElementById('orc_client');
    if (select) {
      select.innerHTML = '<option value="">— Selecione —</option>' +
        (clients || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  },

  // ─────────────────────────────────────────────
  // LISTA PRO ADMIN
  // ─────────────────────────────────────────────
  async list() {
    const { data, error } = await sb
      .from('quotes')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    const tbody = document.getElementById('orcTableBody');
    const cardsContainer = document.getElementById('orcCardsList');

    if (error) {
      const html = `<tr><td colspan="7" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      if (tbody) tbody.innerHTML = html;
      return;
    }

    if (!data || data.length === 0) {
      const empty = '<div class="empty-state"><div class="icon">⚡</div><div class="title">Nenhum orçamento</div></div>';
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${empty}</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = empty;
      return;
    }

    // TABELA (desktop)
    if (tbody) {
      tbody.innerHTML = data.map(q => {
        const clientName = q.clients?.name || q.client_name_temp || '—';
        const isPending = q.status === 'pending_review' || q.status === 'draft';
        return `
          <tr>
            <td><strong>${q.quote_number || '—'}</strong></td>
            <td>${clientName}${q.client_name_temp ? ' <span class="text-warning" style="font-size:0.7rem;">(novo)</span>' : ''}</td>
            <td>${Utils.formatDate(q.created_at?.split('T')[0])}</td>
            <td>${Utils.formatDate(q.valid_until)}</td>
            <td><span class="tag ${q.status}">${this.statusLabel(q.status)}</span></td>
            <td class="text-right">${Utils.money(q.total)}</td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" onclick="Orcamentos.openDetail('${q.id}')" title="Ver/Editar">👁️</button>
                ${q.client_name_temp && q.status === 'accepted' ? `<button class="icon-btn" onclick="Orcamentos.convertToClient('${q.id}')" title="Virar Cliente">✨</button>` : ''}
                <button class="icon-btn danger" onclick="Orcamentos.delete('${q.id}', '${(q.quote_number||'').replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // CARDS (mobile)
    if (cardsContainer) {
      cardsContainer.innerHTML = data.map(q => {
        const clientName = q.clients?.name || q.client_name_temp || '—';
        return `
          <div class="orc-card" onclick="Orcamentos.openDetail('${q.id}')">
            <div class="orc-card-head">
              <div>
                <div class="orc-card-number">${q.quote_number || '—'}</div>
                <div class="orc-card-client">${clientName}${q.client_name_temp ? ' <span class="text-warning" style="font-size:0.7rem;">(novo)</span>' : ''}</div>
              </div>
              <span class="tag ${q.status}">${this.statusLabel(q.status)}</span>
            </div>
            ${q.service_type ? `<div class="orc-card-info">🔧 ${q.service_type}</div>` : ''}
            ${q.client_phone_temp ? `<div class="orc-card-info">📞 ${q.client_phone_temp}</div>` : ''}
            <div class="orc-card-foot">
              <span class="text-muted" style="font-size: 0.75rem;">${Utils.formatDate(q.created_at?.split('T')[0])}</span>
              <span class="orc-card-total">${Utils.money(q.total)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // ─────────────────────────────────────────────
  // LISTA PRO FUNCIONÁRIO (só os que ele criou)
  // ─────────────────────────────────────────────
  async listWorker() {
    const { data, error } = await sb
      .from('quotes')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    const cardsContainer = document.getElementById('orcCardsList');
    if (!cardsContainer) return;

    if (error) {
      cardsContainer.innerHTML = `<div class="text-center text-danger">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚡</div>
          <div class="title">Nenhum orçamento</div>
          <div class="sub">Clica em "Novo Orçamento" pra criar</div>
        </div>
      `;
      return;
    }

    cardsContainer.innerHTML = data.map(q => {
      const clientName = q.clients?.name || q.client_name_temp || '—';
      return `
        <div class="orc-card" onclick="Orcamentos.openWorkerDetail('${q.id}')">
          <div class="orc-card-head">
            <div>
              <div class="orc-card-number">${q.quote_number || '—'}</div>
              <div class="orc-card-client">${clientName}</div>
            </div>
            <span class="tag ${q.status}">${this.statusLabel(q.status)}</span>
          </div>
          ${q.service_type ? `<div class="orc-card-info">🔧 ${q.service_type}</div>` : ''}
          ${q.measurements ? `<div class="orc-card-info">📏 ${q.measurements}</div>` : ''}
          <div class="orc-card-foot">
            <span class="text-muted" style="font-size: 0.75rem;">${Utils.formatDate(q.created_at?.split('T')[0])}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  statusLabel(status) {
    const labels = {
      'draft': 'Rascunho',
      'pending_review': '⏳ Pendente',
      'sent': 'Enviado',
      'accepted': '✅ Aprovado',
      'rejected': '❌ Rejeitado',
      'converted': 'Convertido em OS'
    };
    return labels[status] || status;
  },

  // ─────────────────────────────────────────────
  // NOVO ORÇAMENTO
  // ─────────────────────────────────────────────
  openNew() {
    if (App.isWorker()) {
      this.openNewWorker();
    } else {
      this.openNewAdmin();
    }
  },

  // FORMULÁRIO PRO FUNCIONÁRIO (sem valores)
  openNewWorker() {
    this.editingId = null;
    Utils.clearForm('workerOrcForm');
    document.getElementById('workerOrcModalTitle').textContent = '⚡ Novo Orçamento';
    document.getElementById('workerOrcPhotos').innerHTML = '';
    this.workerOrcPhotos = [];
    Utils.openModal('workerOrcModal');
  },

  workerOrcPhotos: [],

  async uploadWorkerOrcPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    Utils.toast('Enviando foto...', 'info');

    try {
      const ext = file.name.split('.').pop();
      const fileName = `quotes/${Date.now()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('quote-photos')
        .upload(fileName, file);
      if (uploadError) {
        // Tenta no bucket os-photos como fallback
        const { error: fallbackError } = await sb.storage
          .from('os-photos')
          .upload(fileName, file);
        if (fallbackError) throw fallbackError;
        const { data: urlData } = sb.storage.from('os-photos').getPublicUrl(fileName);
        this.workerOrcPhotos.push(urlData.publicUrl);
      } else {
        const { data: urlData } = sb.storage.from('quote-photos').getPublicUrl(fileName);
        this.workerOrcPhotos.push(urlData.publicUrl);
      }

      this.renderWorkerOrcPhotos();
      Utils.toast('✅ Foto adicionada!');
    } catch (err) {
      Utils.toast('Erro: ' + err.message, 'error');
    }
  },

  renderWorkerOrcPhotos() {
    const container = document.getElementById('workerOrcPhotos');
    if (!container) return;
    container.innerHTML = this.workerOrcPhotos.map((url, idx) => `
      <div class="photo-thumb">
        <img src="${url}" alt="Foto ${idx+1}" onclick="window.open('${url}', '_blank')">
        <button class="photo-delete" onclick="Orcamentos.removeWorkerPhoto(${idx})">×</button>
      </div>
    `).join('');
  },

  removeWorkerPhoto(idx) {
    this.workerOrcPhotos.splice(idx, 1);
    this.renderWorkerOrcPhotos();
  },

  async saveWorker() {
    const clientName = document.getElementById('worker_client_name').value.trim();
    const clientPhone = document.getElementById('worker_client_phone').value.trim();
    const clientAddress = document.getElementById('worker_client_address').value.trim();
    const serviceType = document.getElementById('worker_service_type').value.trim();
    const measurements = document.getElementById('worker_measurements').value.trim();
    const notes = document.getElementById('worker_notes').value.trim();

    if (!clientName) { Utils.toast('Nome do cliente é obrigatório', 'error'); return; }
    if (!serviceType) { Utils.toast('Tipo de serviço é obrigatório', 'error'); return; }

    const btn = document.getElementById('workerOrcSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const payload = {
        organization_id: APP_STATE.organization.id,
        quote_number: Utils.generateQuoteNumber(),
        client_name_temp: clientName,
        client_phone_temp: clientPhone,
        client_address_temp: clientAddress,
        service_type: serviceType,
        measurements: measurements,
        notes: notes,
        photos: this.workerOrcPhotos,
        status: 'pending_review',
        created_by_role: 'worker',
        subtotal: 0,
        labor_cost: 0,
        discount: 0,
        total: 0
      };

      const { data, error } = await sb.from('quotes').insert(payload).select().single();
      if (error) throw error;

      // Notificar chefe
      await Notifications.create({
        recipientRole: 'admin',
        type: 'quote_created',
        title: `💰 Novo orçamento de ${APP_STATE.profile.name}`,
        message: `${clientName} - ${serviceType}`,
        relatedId: data.id,
        relatedType: 'quote'
      });

      Utils.toast('✅ Orçamento enviado pro chefe!');
      Utils.closeModal('workerOrcModal');
      await this.listWorker();

    } catch (err) {
      console.error(err);
      Utils.toast('Erro: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Enviar pro Chefe';
    }
  },

  async openWorkerDetail(id) {
    const { data, error } = await sb.from('quotes').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    this.currentQuote = data;
    
    const body = document.getElementById('workerOrcDetailBody');
    body.innerHTML = `
      <div class="detail-section">
        <div class="detail-label">Status</div>
        <div class="detail-value"><span class="tag ${data.status}">${this.statusLabel(data.status)}</span></div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Número</div>
        <div class="detail-value">${data.quote_number || '—'}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Cliente</div>
        <div class="detail-value">${data.client_name_temp || '—'}</div>
      </div>
      ${data.client_phone_temp ? `<div class="detail-section"><div class="detail-label">Telefone</div><div class="detail-value">${data.client_phone_temp}</div></div>` : ''}
      ${data.client_address_temp ? `<div class="detail-section"><div class="detail-label">Endereço</div><div class="detail-value">${data.client_address_temp}</div></div>` : ''}
      <div class="detail-section">
        <div class="detail-label">Serviço</div>
        <div class="detail-value">${data.service_type || '—'}</div>
      </div>
      ${data.measurements ? `<div class="detail-section"><div class="detail-label">Medidas</div><div class="detail-value">${data.measurements}</div></div>` : ''}
      ${data.notes ? `<div class="detail-section"><div class="detail-label">Observações</div><div class="detail-value">${data.notes}</div></div>` : ''}
      ${(data.photos && data.photos.length > 0) ? `
        <div class="detail-section">
          <div class="detail-label">📸 Fotos</div>
          <div class="photos-grid">
            ${data.photos.map(url => `<div class="photo-thumb"><img src="${url}" onclick="window.open('${url}', '_blank')"></div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;

    Utils.openModal('workerOrcDetailModal');
  },

  // ─────────────────────────────────────────────
  // ADMIN — VER E EDITAR ORÇAMENTO
  // ─────────────────────────────────────────────
  openNewAdmin() {
    this.editingId = null;
    document.getElementById('orcModalTitle').textContent = 'Novo Orçamento';
    Utils.clearForm('orcForm');
    document.getElementById('orc_number').value = Utils.generateQuoteNumber();
    document.getElementById('orc_status').value = 'draft';
    Utils.openModal('orcModal');
  },

  async openDetail(id) {
    const { data, error } = await sb.from('quotes').select('*, clients(name, phone, address)').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    this.editingId = id;
    this.currentQuote = data;

    const isWorkerCreated = data.created_by_role === 'worker';
    const isPending = data.status === 'pending_review';
    
    document.getElementById('orcModalTitle').textContent = isPending ? '⏳ Revisar Orçamento' : `Orçamento ${data.quote_number}`;
    
    // Mostrar dados temporários do cliente (se foi funcionário que criou)
    const tempInfoEl = document.getElementById('orcTempClientInfo');
    if (isWorkerCreated && (data.client_name_temp || data.service_type)) {
      tempInfoEl.style.display = 'block';
      tempInfoEl.innerHTML = `
        <div class="info-banner">
          <div style="font-weight: 800; margin-bottom: 8px; color: var(--warning);">📋 DADOS DO FUNCIONÁRIO:</div>
          <div><strong>Cliente:</strong> ${data.client_name_temp || '—'}</div>
          ${data.client_phone_temp ? `<div><strong>Telefone:</strong> ${data.client_phone_temp}</div>` : ''}
          ${data.client_address_temp ? `<div><strong>Endereço:</strong> ${data.client_address_temp}</div>` : ''}
          ${data.service_type ? `<div><strong>Serviço:</strong> ${data.service_type}</div>` : ''}
          ${data.measurements ? `<div><strong>Medidas:</strong> ${data.measurements}</div>` : ''}
          ${(data.photos && data.photos.length > 0) ? `
            <div style="margin-top: 12px;">
              <strong>📸 Fotos:</strong>
              <div class="photos-grid" style="margin-top: 8px;">
                ${data.photos.map(url => `<div class="photo-thumb"><img src="${url}" onclick="window.open('${url}', '_blank')"></div>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      tempInfoEl.style.display = 'none';
    }

    document.getElementById('orc_number').value = data.quote_number || '';
    document.getElementById('orc_client').value = data.client_id || '';
    document.getElementById('orc_subtotal').value = data.subtotal || '';
    document.getElementById('orc_labor').value = data.labor_cost || '';
    document.getElementById('orc_discount').value = data.discount || '';
    document.getElementById('orc_total').value = data.total || '';
    document.getElementById('orc_valid_until').value = data.valid_until || '';
    document.getElementById('orc_payment').value = data.payment_method || '';
    document.getElementById('orc_status').value = data.status || 'draft';
    document.getElementById('orc_notes').value = data.notes || '';

    Utils.openModal('orcModal');
  },

  calculateTotal() {
    const subtotal = parseFloat(document.getElementById('orc_subtotal').value) || 0;
    const labor = parseFloat(document.getElementById('orc_labor').value) || 0;
    const discount = parseFloat(document.getElementById('orc_discount').value) || 0;
    const total = subtotal + labor - discount;
    document.getElementById('orc_total').value = total.toFixed(2);
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      quote_number: document.getElementById('orc_number').value.trim(),
      client_id: document.getElementById('orc_client').value || null,
      subtotal: parseFloat(document.getElementById('orc_subtotal').value) || 0,
      labor_cost: parseFloat(document.getElementById('orc_labor').value) || 0,
      discount: parseFloat(document.getElementById('orc_discount').value) || 0,
      total: parseFloat(document.getElementById('orc_total').value) || 0,
      valid_until: document.getElementById('orc_valid_until').value || null,
      payment_method: document.getElementById('orc_payment').value,
      status: document.getElementById('orc_status').value,
      notes: document.getElementById('orc_notes').value.trim()
    };

    let result;
    if (this.editingId) {
      result = await sb.from('quotes').update(payload).eq('id', this.editingId);
    } else {
      result = await sb.from('quotes').insert(payload);
    }

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }

    Utils.toast(this.editingId ? 'Orçamento atualizado!' : 'Orçamento criado!');
    Utils.closeModal('orcModal');
    await this.list();
  },

  // VIRAR EM CLIENTE
  async convertToClient(quoteId) {
    if (!await Utils.confirm('Cadastrar esse cliente automaticamente nos clientes?')) return;

    const { data: quote, error } = await sb.from('quotes').select('*').eq('id', quoteId).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    if (!quote.client_name_temp) {
      Utils.toast('Esse orçamento já tem cliente', 'error');
      return;
    }

    // Cria o cliente
    const { data: client, error: clientError } = await sb.from('clients').insert({
      organization_id: APP_STATE.organization.id,
      name: quote.client_name_temp,
      phone: quote.client_phone_temp,
      address: quote.client_address_temp
    }).select().single();

    if (clientError) { Utils.toast('Erro: ' + clientError.message, 'error'); return; }

    // Atualiza o orçamento linkando ao cliente
    await sb.from('quotes').update({
      client_id: client.id,
      client_name_temp: null,
      client_phone_temp: null,
      client_address_temp: null
    }).eq('id', quoteId);

    Utils.toast(`✅ ${client.name} cadastrado como cliente!`);
    await this.list();
  },

  async delete(id, number) {
    if (!await Utils.confirm(`Deletar orçamento "${number}"?`)) return;
    const { error } = await sb.from('quotes').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Orçamento deletado!');
    await this.list();
  }

};
