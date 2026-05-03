// ═══════════════════════════════════════════════════════════════
// MÓDULO: FINANCEIRO
// ═══════════════════════════════════════════════════════════════

const Financeiro = {

  editingId: null,

  async load() {
    await Promise.all([this.loadStats(), this.list()]);
  },

  async loadStats() {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const { data: transactions } = await sb
      .from('transactions')
      .select('type, amount, occurred_at')
      .gte('occurred_at', monthStart);

    let income = 0, expense = 0;
    (transactions || []).forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    });

    document.getElementById('finIncome').textContent = Utils.money(income);
    document.getElementById('finExpense').textContent = Utils.money(expense);
    document.getElementById('finBalance').textContent = Utils.money(income - expense);
  },

  async list() {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(50);

    const tbody = document.getElementById('finTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">💰</div><div class="title">Nenhuma transação</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(t => `
      <tr>
        <td>${Utils.formatDate(t.occurred_at)}</td>
        <td><span class="tag ${t.type === 'income' ? 'done' : 'alert'}">${t.type === 'income' ? '💰 Entrada' : '💸 Saída'}</span></td>
        <td><span class="text-dim">${t.category || '—'}</span></td>
        <td>${t.description}</td>
        <td class="text-right ${t.type === 'income' ? 'text-secondary' : 'text-danger'} fw-700">${Utils.money(t.amount)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" onclick="Financeiro.edit('${t.id}')" title="Editar">✏️</button>
            <button class="icon-btn danger" onclick="Financeiro.delete('${t.id}')" title="Deletar">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNew(type = 'income') {
    this.editingId = null;
    document.getElementById('finModalTitle').textContent = type === 'income' ? 'Nova Entrada' : 'Nova Saída';
    Utils.clearForm('finForm');
    document.getElementById('fin_type').value = type;
    document.getElementById('fin_date').value = new Date().toISOString().split('T')[0];
    Utils.openModal('finModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('transactions').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }
    this.editingId = id;
    document.getElementById('finModalTitle').textContent = 'Editar Transação';
    document.getElementById('fin_type').value = data.type;
    document.getElementById('fin_category').value = data.category || '';
    document.getElementById('fin_description').value = data.description;
    document.getElementById('fin_amount').value = data.amount;
    document.getElementById('fin_date').value = data.occurred_at;
    Utils.openModal('finModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      type: document.getElementById('fin_type').value,
      category: document.getElementById('fin_category').value.trim(),
      description: document.getElementById('fin_description').value.trim(),
      amount: parseFloat(document.getElementById('fin_amount').value) || 0,
      occurred_at: document.getElementById('fin_date').value
    };

    if (!payload.description) { Utils.toast('Descrição obrigatória', 'error'); return; }
    if (payload.amount <= 0) { Utils.toast('Valor deve ser maior que zero', 'error'); return; }

    let result;
    if (this.editingId) result = await sb.from('transactions').update(payload).eq('id', this.editingId);
    else result = await sb.from('transactions').insert(payload);

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }
    Utils.toast(this.editingId ? 'Atualizado!' : 'Lançamento criado!');
    Utils.closeModal('finModal');
    await this.load();
  },

  async delete(id) {
    if (!await Utils.confirm('Deletar este lançamento?')) return;
    const { error } = await sb.from('transactions').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Deletado!');
    await this.load();
  }

};
