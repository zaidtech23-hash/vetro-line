// ═══════════════════════════════════════════════════════════════
// MÓDULO: CLIENTES
// ═══════════════════════════════════════════════════════════════
// CRUD completo: criar, listar, editar, deletar.
// ═══════════════════════════════════════════════════════════════

const Clientes = {

  editingId: null,

  async load() {
    await this.list();
  },

  async list() {
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .order('name');

    const tbody = document.getElementById('clientsTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">👥</div><div class="title">Nenhum cliente cadastrado</div><div class="sub">Clica em "Novo Cliente" pra começar</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${c.cpf_cnpj || '—'}</td>
        <td>${c.city || '—'}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Clientes.edit('${c.id}')" title="Editar">✏️</button>
            <button class="icon-btn danger" onclick="Clientes.delete('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNew() {
    this.editingId = null;
    document.getElementById('clienteModalTitle').textContent = 'Novo Cliente';
    Utils.clearForm('clienteForm');
    Utils.openModal('clienteModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('clients').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro ao carregar cliente', 'error'); return; }

    this.editingId = id;
    document.getElementById('clienteModalTitle').textContent = 'Editar Cliente';
    document.getElementById('cli_name').value = data.name || '';
    document.getElementById('cli_phone').value = data.phone || '';
    document.getElementById('cli_email').value = data.email || '';
    document.getElementById('cli_cpf').value = data.cpf_cnpj || '';
    document.getElementById('cli_address').value = data.address || '';
    document.getElementById('cli_city').value = data.city || '';
    document.getElementById('cli_notes').value = data.notes || '';
    Utils.openModal('clienteModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      name: document.getElementById('cli_name').value.trim(),
      phone: document.getElementById('cli_phone').value.trim(),
      email: document.getElementById('cli_email').value.trim(),
      cpf_cnpj: document.getElementById('cli_cpf').value.trim(),
      address: document.getElementById('cli_address').value.trim(),
      city: document.getElementById('cli_city').value.trim(),
      notes: document.getElementById('cli_notes').value.trim()
    };

    if (!payload.name) {
      Utils.toast('Nome é obrigatório', 'error');
      return;
    }

    let result;
    if (this.editingId) {
      result = await sb.from('clients').update(payload).eq('id', this.editingId);
    } else {
      result = await sb.from('clients').insert(payload);
    }

    if (result.error) {
      Utils.toast('Erro: ' + result.error.message, 'error');
      return;
    }

    Utils.toast(this.editingId ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    Utils.closeModal('clienteModal');
    await this.list();
  },

  async delete(id, name) {
    if (!await Utils.confirm(`Deletar cliente "${name}"?\n\nIsso não pode ser desfeito.`)) return;

    const { error } = await sb.from('clients').delete().eq('id', id);
    if (error) {
      Utils.toast('Erro: ' + error.message, 'error');
      return;
    }

    Utils.toast('Cliente deletado!');
    await this.list();
  }

};
