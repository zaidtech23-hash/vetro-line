// ═══════════════════════════════════════════════════════════════
// MÓDULO: ESTOQUE
// ═══════════════════════════════════════════════════════════════

const Estoque = {

  editingId: null,

  async load() {
    await this.list();
  },

  async list() {
    const { data, error } = await sb
      .from('inventory_items')
      .select('*')
      .order('code');

    const tbody = document.getElementById('estoqueTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">📦</div><div class="title">Estoque vazio</div><div class="sub">Cadastra os primeiros itens</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(item => {
      const isLow = Number(item.quantity) <= Number(item.min_quantity);
      return `
        <tr>
          <td><strong>${item.code || '—'}</strong></td>
          <td>${item.name}</td>
          <td><span class="text-dim">${item.category || '—'}</span></td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.min_quantity} ${item.unit}</td>
          <td>${Utils.money(item.cost_per_unit)}</td>
          <td>${isLow ? '<span class="tag alert">⚠️ Estoque baixo</span>' : '<span class="tag done">✓ OK</span>'}</td>
          <td>
            <div class="table-actions">
              <button class="icon-btn" onclick="Estoque.edit('${item.id}')" title="Editar">✏️</button>
              <button class="icon-btn danger" onclick="Estoque.delete('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openNew() {
    this.editingId = null;
    document.getElementById('estoqueModalTitle').textContent = 'Novo Item de Estoque';
    Utils.clearForm('estoqueForm');
    document.getElementById('inv_unit').value = 'un';
    Utils.openModal('estoqueModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('inventory_items').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro ao carregar', 'error'); return; }

    this.editingId = id;
    document.getElementById('estoqueModalTitle').textContent = 'Editar Item';
    document.getElementById('inv_code').value = data.code || '';
    document.getElementById('inv_name').value = data.name || '';
    document.getElementById('inv_category').value = data.category || '';
    document.getElementById('inv_unit').value = data.unit || 'un';
    document.getElementById('inv_quantity').value = data.quantity || 0;
    document.getElementById('inv_min_quantity').value = data.min_quantity || 0;
    document.getElementById('inv_cost').value = data.cost_per_unit || 0;
    document.getElementById('inv_supplier').value = data.supplier || '';
    document.getElementById('inv_notes').value = data.notes || '';
    Utils.openModal('estoqueModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      code: document.getElementById('inv_code').value.trim(),
      name: document.getElementById('inv_name').value.trim(),
      category: document.getElementById('inv_category').value.trim(),
      unit: document.getElementById('inv_unit').value,
      quantity: parseFloat(document.getElementById('inv_quantity').value) || 0,
      min_quantity: parseFloat(document.getElementById('inv_min_quantity').value) || 0,
      cost_per_unit: parseFloat(document.getElementById('inv_cost').value) || 0,
      supplier: document.getElementById('inv_supplier').value.trim(),
      notes: document.getElementById('inv_notes').value.trim()
    };

    if (!payload.name) { Utils.toast('Nome é obrigatório', 'error'); return; }

    let result;
    if (this.editingId) {
      result = await sb.from('inventory_items').update(payload).eq('id', this.editingId);
    } else {
      result = await sb.from('inventory_items').insert(payload);
    }

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }

    Utils.toast(this.editingId ? 'Item atualizado!' : 'Item cadastrado!');
    Utils.closeModal('estoqueModal');
    await this.list();
  },

  async delete(id, name) {
    if (!await Utils.confirm(`Deletar item "${name}"?`)) return;
    const { error } = await sb.from('inventory_items').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Item deletado!');
    await this.list();
  }

};
