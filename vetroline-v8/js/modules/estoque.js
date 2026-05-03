// ═══════════════════════════════════════════════════════════════
// MÓDULO: ESTOQUE v7
// ═══════════════════════════════════════════════════════════════

const Estoque = {

  editingId: null,
  searchResults: [],
  selectedItem: null,

  async load() {
    if (App.isWorker()) {
      await this.listWorker();
    } else {
      await this.list();
    }
  },

  // ─────────────────────────────────────────────
  // LISTA PRO ADMIN
  // ─────────────────────────────────────────────
  async list() {
    const { data, error } = await sb.from('inventory_items').select('*').order('name');
    const tbody = document.getElementById('estoqueTableBody');
    const cardsContainer = document.getElementById('estoqueCardsList');

    if (error) {
      const html = `<tr><td colspan="8" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      if (tbody) tbody.innerHTML = html;
      return;
    }

    if (!data || data.length === 0) {
      const empty = '<div class="empty-state"><div class="icon">📦</div><div class="title">Estoque vazio</div></div>';
      if (tbody) tbody.innerHTML = `<tr><td colspan="8">${empty}</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = empty;
      return;
    }

    if (tbody) {
      tbody.innerHTML = data.map(item => {
        const lowStock = item.min_quantity > 0 && item.quantity <= item.min_quantity;
        return `
          <tr>
            <td>${item.code || '—'}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category || '—'}</td>
            <td>${item.quantity || 0} ${item.unit || ''}</td>
            <td>${item.min_quantity || 0}</td>
            <td>${Utils.money(item.cost)}</td>
            <td>${lowStock ? '<span class="text-danger">⚠️ Baixo</span>' : '<span class="text-secondary">✓ OK</span>'}</td>
            <td>
              <div class="table-actions">
                <button class="icon-btn" onclick="Estoque.edit('${item.id}')" title="Editar">✏️</button>
                <button class="icon-btn danger" onclick="Estoque.delete('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = data.map(item => {
        const lowStock = item.min_quantity > 0 && item.quantity <= item.min_quantity;
        return `
          <div class="estoque-card ${lowStock ? 'low' : ''}">
            <div class="estoque-card-head">
              <div>
                <div class="estoque-card-code">${item.code || '—'}</div>
                <div class="estoque-card-name">${item.name}</div>
              </div>
              ${lowStock ? '<span class="text-danger" style="font-size: 0.75rem;">⚠️ BAIXO</span>' : ''}
            </div>
            <div class="estoque-card-info">
              <div><strong>Quantidade:</strong> ${item.quantity || 0} ${item.unit || ''}</div>
              ${item.category ? `<div><strong>Categoria:</strong> ${item.category}</div>` : ''}
            </div>
            <div class="estoque-card-actions">
              <button class="btn-secondary" onclick="Estoque.edit('${item.id}')">✏️ Editar</button>
              <button class="btn-secondary" style="color: var(--danger); border-color: #ef476f30;" onclick="Estoque.delete('${item.id}', '${item.name.replace(/'/g, "\\'")}')">🗑️ Deletar</button>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // ─────────────────────────────────────────────
  // LISTA PRO FUNCIONÁRIO (read-only)
  // ─────────────────────────────────────────────
  async listWorker() {
    const { data, error } = await sb.from('inventory_items').select('*').order('name');
    const cardsContainer = document.getElementById('estoqueCardsList');

    if (error) {
      cardsContainer.innerHTML = `<div class="text-center text-danger">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <div class="title">Estoque vazio</div>
          <div class="sub">Aguarde o chefe cadastrar produtos</div>
        </div>
      `;
      return;
    }

    cardsContainer.innerHTML = data.map(item => {
      const lowStock = item.min_quantity > 0 && item.quantity <= item.min_quantity;
      return `
        <div class="estoque-card ${lowStock ? 'low' : ''}">
          <div class="estoque-card-head">
            <div>
              <div class="estoque-card-code">${item.code || '—'}</div>
              <div class="estoque-card-name">${item.name}</div>
            </div>
            ${lowStock ? '<span class="text-danger" style="font-size: 0.75rem;">⚠️ BAIXO</span>' : ''}
          </div>
          <div class="estoque-card-info">
            <div><strong>Quantidade:</strong> ${item.quantity || 0} ${item.unit || ''}</div>
            ${item.category ? `<div><strong>Categoria:</strong> ${item.category}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // ─────────────────────────────────────────────
  // ENTRADA DE ESTOQUE (FUNCIONÁRIO)
  // ─────────────────────────────────────────────
  openEntry() {
    this.selectedItem = null;
    document.getElementById('entry_search').value = '';
    document.getElementById('entry_results').innerHTML = '';
    document.getElementById('entry_selected').style.display = 'none';
    document.getElementById('entry_quantity').value = '';
    document.getElementById('entry_observations').value = '';
    document.getElementById('entry_notFound').style.display = 'none';
    Utils.openModal('entryModal');
  },

  async searchProduct() {
    const query = document.getElementById('entry_search').value.trim();
    
    if (query.length < 2) {
      document.getElementById('entry_results').innerHTML = '';
      document.getElementById('entry_notFound').style.display = 'none';
      return;
    }

    const { data, error } = await sb
      .from('inventory_items')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(10);

    const resultsEl = document.getElementById('entry_results');
    const notFoundEl = document.getElementById('entry_notFound');

    if (error) {
      resultsEl.innerHTML = `<div class="text-danger">Erro: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      resultsEl.innerHTML = '';
      notFoundEl.style.display = 'block';
      return;
    }

    notFoundEl.style.display = 'none';
    this.searchResults = data;
    resultsEl.innerHTML = data.map(item => `
      <div class="search-result-item" onclick="Estoque.selectItem('${item.id}')">
        <div class="search-result-name">${item.name}</div>
        <div class="search-result-info">
          ${item.code || '—'} · ${item.category || 'sem categoria'} · ${item.quantity || 0} ${item.unit || ''} no estoque
        </div>
      </div>
    `).join('');
  },

  selectItem(id) {
    const item = this.searchResults.find(i => i.id === id);
    if (!item) return;

    this.selectedItem = item;
    document.getElementById('entry_results').innerHTML = '';
    document.getElementById('entry_search').value = '';
    
    document.getElementById('entry_selected').style.display = 'block';
    document.getElementById('entry_selected_name').textContent = item.name;
    document.getElementById('entry_selected_info').textContent = `${item.code || '—'} · ${item.category || 'sem categoria'} · Estoque atual: ${item.quantity || 0} ${item.unit || ''}`;
  },

  clearSelected() {
    this.selectedItem = null;
    document.getElementById('entry_selected').style.display = 'none';
  },

  async saveEntry() {
    if (!this.selectedItem) {
      Utils.toast('Selecione um produto primeiro', 'error');
      return;
    }

    const quantity = parseFloat(document.getElementById('entry_quantity').value);
    const observations = document.getElementById('entry_observations').value.trim();

    if (!quantity || quantity <= 0) {
      Utils.toast('Coloca a quantidade que chegou', 'error');
      return;
    }

    const btn = document.getElementById('entrySaveBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      // Salva entrada
      await sb.from('inventory_entries').insert({
        organization_id: APP_STATE.organization.id,
        inventory_item_id: this.selectedItem.id,
        quantity: quantity,
        observations: observations,
        created_by: APP_STATE.user.id
      });

      // Atualiza quantidade no item
      const newQuantity = (parseFloat(this.selectedItem.quantity) || 0) + quantity;
      await sb.from('inventory_items').update({ quantity: newQuantity }).eq('id', this.selectedItem.id);

      // Notifica chefe
      await Notifications.create({
        recipientRole: 'admin',
        type: 'inventory_entry',
        title: `📦 Entrada de estoque`,
        message: `${APP_STATE.profile.name} adicionou ${quantity} ${this.selectedItem.unit || ''} de ${this.selectedItem.name}`
      });

      Utils.toast(`✅ +${quantity} ${this.selectedItem.unit || ''} adicionado!`);
      Utils.closeModal('entryModal');
      await this.listWorker();

    } catch (err) {
      Utils.toast('Erro: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Salvar Entrada';
    }
  },

  // CADASTRAR PRODUTO NOVO (funcionário)
  openNewProduct() {
    Utils.closeModal('entryModal');
    this.editingId = null;
    document.getElementById('estoqueModalTitle').textContent = '➕ Cadastrar Produto Novo';
    Utils.clearForm('estoqueForm');
    
    // Esconde campos de valor pro funcionário
    if (App.isWorker()) {
      document.querySelectorAll('.admin-only-field').forEach(el => el.style.display = 'none');
    } else {
      document.querySelectorAll('.admin-only-field').forEach(el => el.style.display = '');
    }
    
    Utils.openModal('estoqueModal');
  },

  // ─────────────────────────────────────────────
  // CADASTRAR / EDITAR (ADMIN)
  // ─────────────────────────────────────────────
  openNew() {
    this.editingId = null;
    document.getElementById('estoqueModalTitle').textContent = 'Novo Item';
    Utils.clearForm('estoqueForm');
    document.querySelectorAll('.admin-only-field').forEach(el => el.style.display = '');
    Utils.openModal('estoqueModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('inventory_items').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    this.editingId = id;
    document.getElementById('estoqueModalTitle').textContent = 'Editar Item';
    document.getElementById('inv_code').value = data.code || '';
    document.getElementById('inv_name').value = data.name || '';
    document.getElementById('inv_category').value = data.category || '';
    document.getElementById('inv_unit').value = data.unit || 'un';
    document.getElementById('inv_quantity').value = data.quantity || 0;
    document.getElementById('inv_min_quantity').value = data.min_quantity || 0;
    document.getElementById('inv_cost').value = data.cost || 0;
    document.getElementById('inv_supplier').value = data.supplier || '';
    document.getElementById('inv_notes').value = data.notes || '';
    
    document.querySelectorAll('.admin-only-field').forEach(el => el.style.display = '');
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
      notes: document.getElementById('inv_notes').value.trim()
    };

    if (!App.isWorker()) {
      payload.cost = parseFloat(document.getElementById('inv_cost').value) || 0;
      payload.supplier = document.getElementById('inv_supplier').value.trim();
    }

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
    
    if (App.isWorker()) {
      await this.listWorker();
    } else {
      await this.list();
    }
  },

  async delete(id, name) {
    if (!await Utils.confirm(`Deletar "${name}"?`)) return;
    const { error } = await sb.from('inventory_items').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Item deletado!');
    await this.list();
  }

};
