// ═══════════════════════════════════════════════════════════════
// MÓDULO: ORÇAMENTOS
// ═══════════════════════════════════════════════════════════════

const Orcamentos = {

  editingId: null,

  async load() {
    await Promise.all([this.list(), this.loadClients()]);
  },

  async loadClients() {
    const { data } = await sb.from('clients').select('id, name').order('name');
    const select = document.getElementById('orc_client');
    if (select) {
      select.innerHTML = '<option value="">— Selecione cliente —</option>' +
        (data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  },

  async list() {
    const { data, error } = await sb
      .from('quotes')
      .select('id, quote_number, status, total, valid_until, created_at, clients(name)')
      .order('created_at', { ascending: false });

    const tbody = document.getElementById('orcTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">📄</div><div class="title">Nenhum orçamento</div><div class="sub">Clica em "Novo Orçamento"</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(q => `
      <tr>
        <td><strong>${q.quote_number || '—'}</strong></td>
        <td>${q.clients?.name || '—'}</td>
        <td>${Utils.formatDate(q.created_at?.split('T')[0])}</td>
        <td>${Utils.formatDate(q.valid_until)}</td>
        <td><span class="tag ${q.status}">${Utils.quoteStatusLabel(q.status)}</span></td>
        <td class="text-right fw-700">${Utils.money(q.total)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Orcamentos.edit('${q.id}')" title="Editar">✏️</button>
            <button class="icon-btn" onclick="Orcamentos.exportPDF('${q.id}')" title="PDF">📄</button>
            <button class="icon-btn danger" onclick="Orcamentos.delete('${q.id}', '${(q.quote_number || '').replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNew() {
    this.editingId = null;
    document.getElementById('orcModalTitle').textContent = 'Novo Orçamento';
    Utils.clearForm('orcForm');
    document.getElementById('orc_number').value = Utils.generateQuoteNumber();
    document.getElementById('orc_status').value = 'draft';
    // Validade padrão: 30 dias
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    document.getElementById('orc_valid_until').value = validUntil.toISOString().split('T')[0];
    Utils.openModal('orcModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('quotes').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }
    this.editingId = id;
    document.getElementById('orcModalTitle').textContent = 'Editar Orçamento';
    document.getElementById('orc_number').value = data.quote_number || '';
    document.getElementById('orc_client').value = data.client_id || '';
    document.getElementById('orc_subtotal').value = data.subtotal || 0;
    document.getElementById('orc_labor').value = data.labor_cost || 0;
    document.getElementById('orc_discount').value = data.discount || 0;
    document.getElementById('orc_total').value = data.total || 0;
    document.getElementById('orc_payment').value = data.payment_method || '';
    document.getElementById('orc_delivery').value = data.delivery_days || '';
    document.getElementById('orc_valid_until').value = data.valid_until || '';
    document.getElementById('orc_status').value = data.status || 'draft';
    document.getElementById('orc_notes').value = data.notes || '';
    Utils.openModal('orcModal');
  },

  // Calcula total automaticamente
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
      payment_method: document.getElementById('orc_payment').value,
      delivery_days: parseInt(document.getElementById('orc_delivery').value) || null,
      valid_until: document.getElementById('orc_valid_until').value || null,
      status: document.getElementById('orc_status').value,
      notes: document.getElementById('orc_notes').value.trim()
    };

    let result;
    if (this.editingId) result = await sb.from('quotes').update(payload).eq('id', this.editingId);
    else result = await sb.from('quotes').insert(payload);

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }
    Utils.toast(this.editingId ? 'Orçamento atualizado!' : 'Orçamento criado!');
    Utils.closeModal('orcModal');
    await this.list();
  },

  async delete(id, num) {
    if (!await Utils.confirm(`Deletar orçamento "${num}"?`)) return;
    const { error } = await sb.from('quotes').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Deletado!');
    await this.list();
  },

  // EXPORTAR PDF (simples)
  async exportPDF(id) {
    const { data: q } = await sb.from('quotes').select('*, clients(*)').eq('id', id).single();
    if (!q) return;

    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${q.quote_number}</title>
      <style>
        body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #00c9ff; border-bottom: 2px solid #00c9ff; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { color: #666; font-weight: bold; }
        .total { font-size: 1.5em; color: #06d6a0; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ccc; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>VetroLine — Orçamento ${q.quote_number}</h1>
      <p><strong>${APP_STATE.organization.name}</strong></p>
      <p>${APP_STATE.organization.cnpj || ''}</p>
      <hr style="margin: 20px 0;">
      <h3>Cliente</h3>
      <p>${q.clients?.name || '—'}<br>${q.clients?.phone || ''}<br>${q.clients?.address || ''}</p>
      <h3>Valores</h3>
      <div class="row"><span class="label">Subtotal:</span><span>${Utils.money(q.subtotal)}</span></div>
      <div class="row"><span class="label">Mão de obra:</span><span>${Utils.money(q.labor_cost)}</span></div>
      <div class="row"><span class="label">Desconto:</span><span>- ${Utils.money(q.discount)}</span></div>
      <div class="row total"><span>TOTAL:</span><span>${Utils.money(q.total)}</span></div>
      <p style="margin-top: 30px;"><strong>Forma de pagamento:</strong> ${q.payment_method || '—'}</p>
      <p><strong>Prazo de entrega:</strong> ${q.delivery_days ? q.delivery_days + ' dias' : '—'}</p>
      <p><strong>Válido até:</strong> ${Utils.formatDate(q.valid_until)}</p>
      ${q.notes ? `<p style="margin-top: 20px;"><strong>Observações:</strong><br>${q.notes}</p>` : ''}
      <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #00c9ff; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
      </body></html>
    `);
  }

};
