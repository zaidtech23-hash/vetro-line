// ═══════════════════════════════════════════════════════════════
// MÓDULO: PRODUTOS (catálogo)
// ═══════════════════════════════════════════════════════════════

const Produtos = {

  editingId: null,

  async load() { await this.list(); },

  async list() {
    const { data, error } = await sb.from('products').select('*').order('name');
    const tbody = document.getElementById('produtosTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">🏷️</div><div class="title">Nenhum produto</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="text-dim">${p.category || '—'}</span></td>
        <td>${Utils.money(p.price)}</td>
        <td>${Utils.money(p.cost)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Produtos.edit('${p.id}')" title="Editar">✏️</button>
            <button class="icon-btn danger" onclick="Produtos.delete('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNew() {
    this.editingId = null;
    document.getElementById('produtoModalTitle').textContent = 'Novo Produto';
    Utils.clearForm('produtoForm');
    Utils.openModal('produtoModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('products').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }
    this.editingId = id;
    document.getElementById('produtoModalTitle').textContent = 'Editar Produto';
    document.getElementById('prod_name').value = data.name || '';
    document.getElementById('prod_description').value = data.description || '';
    document.getElementById('prod_category').value = data.category || '';
    document.getElementById('prod_price').value = data.price || 0;
    document.getElementById('prod_cost').value = data.cost || 0;
    Utils.openModal('produtoModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      name: document.getElementById('prod_name').value.trim(),
      description: document.getElementById('prod_description').value.trim(),
      category: document.getElementById('prod_category').value.trim(),
      unit: 'un',
      price: parseFloat(document.getElementById('prod_price').value) || 0,
      cost: parseFloat(document.getElementById('prod_cost').value) || 0
    };

    if (!payload.name) { Utils.toast('Nome obrigatório', 'error'); return; }

    let result;
    if (this.editingId) result = await sb.from('products').update(payload).eq('id', this.editingId);
    else result = await sb.from('products').insert(payload);

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }
    Utils.toast(this.editingId ? 'Produto atualizado!' : 'Produto cadastrado!');
    Utils.closeModal('produtoModal');
    await this.list();
  },

  async delete(id, name) {
    if (!await Utils.confirm(`Deletar produto "${name}"?`)) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Produto deletado!');
    await this.list();
  }

};
