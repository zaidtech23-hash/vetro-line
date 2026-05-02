// ═══════════════════════════════════════════════════════════════
// MÓDULO: ORDENS DE SERVIÇO (CHEFE)
// ═══════════════════════════════════════════════════════════════

const Ordens = {

  editingId: null,

  async load() {
    await Promise.all([this.list(), this.loadClientsAndWorkers()]);
  },

  async loadClientsAndWorkers() {
    const { data: clients } = await sb.from('clients').select('id, name').order('name');
    const clientSelect = document.getElementById('os_client');
    if (clientSelect) {
      clientSelect.innerHTML = '<option value="">— Selecione —</option>' +
        (clients || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    const { data: workers } = await sb.from('profiles').select('id, name').order('name');
    const workerSelect = document.getElementById('os_worker');
    if (workerSelect) {
      workerSelect.innerHTML = '<option value="">— Sem responsável —</option>' +
        (workers || []).map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    }
  },

  async list() {
    const { data, error } = await sb
      .from('service_orders')
      .select('id, os_number, title, status, priority, due_date, total, clients(name), profiles(name)')
      .order('due_date', { ascending: false });

    const tbody = document.getElementById('osTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">📋</div><div class="title">Nenhuma OS</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(os => `
      <tr>
        <td><strong>${os.os_number || '—'}</strong></td>
        <td>${os.title}</td>
        <td>${os.clients?.name || '—'}</td>
        <td>${os.profiles?.name || '<span class="text-muted">Não atribuído</span>'}</td>
        <td>${Utils.formatDate(os.due_date)}</td>
        <td><span class="tag ${os.status}">${Utils.statusLabel(os.status)}</span></td>
        <td class="text-right">${Utils.money(os.total)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Ordens.openCuts('${os.id}', '${(os.os_number || '').replace(/'/g, "\\'")}')" title="Cortes">✂️</button>
            <button class="icon-btn" onclick="Ordens.edit('${os.id}')" title="Editar">✏️</button>
            <button class="icon-btn danger" onclick="Ordens.delete('${os.id}', '${(os.os_number || '').replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNew() {
    this.editingId = null;
    document.getElementById('osModalTitle').textContent = 'Nova Ordem de Serviço';
    Utils.clearForm('osForm');
    document.getElementById('os_number').value = Utils.generateOSNumber();
    document.getElementById('os_status').value = 'pending';
    document.getElementById('os_priority').value = 'normal';
    Utils.openModal('osModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('service_orders').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    this.editingId = id;
    document.getElementById('osModalTitle').textContent = 'Editar OS';
    document.getElementById('os_number').value = data.os_number || '';
    document.getElementById('os_title').value = data.title || '';
    document.getElementById('os_description').value = data.description || '';
    document.getElementById('os_client').value = data.client_id || '';
    document.getElementById('os_worker').value = data.worker_id || '';
    document.getElementById('os_due_date').value = data.due_date || '';
    document.getElementById('os_status').value = data.status || 'pending';
    document.getElementById('os_priority').value = data.priority || 'normal';
    document.getElementById('os_total').value = data.total || '';
    Utils.openModal('osModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      os_number: document.getElementById('os_number').value.trim(),
      title: document.getElementById('os_title').value.trim(),
      description: document.getElementById('os_description').value.trim(),
      client_id: document.getElementById('os_client').value || null,
      worker_id: document.getElementById('os_worker').value || null,
      due_date: document.getElementById('os_due_date').value || null,
      status: document.getElementById('os_status').value,
      priority: document.getElementById('os_priority').value,
      total: parseFloat(document.getElementById('os_total').value) || 0
    };

    if (!payload.title) { Utils.toast('Título obrigatório', 'error'); return; }

    let result;
    if (this.editingId) result = await sb.from('service_orders').update(payload).eq('id', this.editingId);
    else result = await sb.from('service_orders').insert(payload);

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }

    Utils.toast(this.editingId ? 'OS atualizada!' : 'OS criada!');
    Utils.closeModal('osModal');
    await this.list();
  },

  async delete(id, number) {
    if (!await Utils.confirm(`Deletar OS "${number}"?`)) return;
    const { error } = await sb.from('service_orders').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('OS deletada!');
    await this.list();
  },

  // GERENCIAR CORTES DE UMA OS
  openCuts(osId, osNumber) {
    document.getElementById('cutsManagerTitle').textContent = `✂️ Cortes da OS ${osNumber}`;
    Cortes.currentOSId = osId;
    Cortes.loadForOS(osId);
    Utils.openModal('cutsManagerModal');
  }

};
