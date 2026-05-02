// ═══════════════════════════════════════════════════════════════
// MÓDULO: DASHBOARD
// ═══════════════════════════════════════════════════════════════
// Mostra estatísticas reais puxando do banco de dados.
// ═══════════════════════════════════════════════════════════════

const Dashboard = {

  async load() {
    // Atualiza saudação
    document.getElementById('greetingName').textContent = APP_STATE.profile.name;
    document.getElementById('greetingDate').textContent = Utils.formatDateLong();

    // Carrega estatísticas em paralelo
    await Promise.all([
      this.loadStats(),
      this.loadTodayOrders(),
      this.loadWorkers()
    ]);
  },

  async loadStats() {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Total de OS de hoje
    const { count: todayCount } = await sb
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('due_date', today);

    // Concluídas hoje
    const { count: doneCount } = await sb
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done')
      .gte('updated_at', today);

    // Receita do mês
    const { data: incomeData } = await sb
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
      .gte('occurred_at', monthStart);
    const totalIncome = (incomeData || []).reduce((sum, t) => sum + Number(t.amount), 0);

    // Alertas (estoque baixo)
    const { data: lowStock } = await sb
      .from('inventory_items')
      .select('id, quantity, min_quantity');
    const alerts = (lowStock || []).filter(i => Number(i.quantity) <= Number(i.min_quantity)).length;

    // Atualiza UI
    document.getElementById('statToday').textContent = todayCount || 0;
    document.getElementById('statDone').textContent = doneCount || 0;
    document.getElementById('statIncome').textContent = Utils.money(totalIncome);
    document.getElementById('statAlerts').textContent = alerts;
  },

  async loadTodayOrders() {
    const { data, error } = await sb
      .from('service_orders')
      .select('id, os_number, title, status, due_date, clients(name), profiles(name)')
      .order('due_date', { ascending: true })
      .limit(5);

    const container = document.getElementById('todayOrdersList');

    if (error || !data || data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="title">Nenhuma OS</div><div class="sub">Crie a primeira ordem de serviço</div></div>';
      return;
    }

    container.innerHTML = data.map(os => {
      const dotClass = { done: 'done', in_field: 'going', pending: 'wait', in_production: 'warn' }[os.status] || 'wait';
      return `
        <div class="list-item" onclick="App.showScreen('os')">
          <div class="dot ${dotClass}"></div>
          <div class="flex-1">
            <div class="item-name">${os.title}</div>
            <div class="item-sub">${os.clients?.name || 'Sem cliente'} · ${os.profiles?.name || 'Não atribuído'}</div>
          </div>
          <div class="tag ${os.status}">${Utils.statusLabel(os.status)}</div>
        </div>
      `;
    }).join('');
  },

  async loadWorkers() {
    const { data } = await sb
      .from('profiles')
      .select('id, name, role, active')
      .order('name');

    const container = document.getElementById('workersList');

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="title">Nenhum funcionário</div></div>';
      return;
    }

    container.innerHTML = data.map(w => `
      <div class="list-item">
        <div class="avatar sm">${Auth.getInitials(w.name)}</div>
        <div class="flex-1">
          <div class="item-name">${w.name}</div>
          <div class="item-sub">${Auth.roleLabel(w.role)}</div>
        </div>
        <div class="dot ${w.active ? 'done' : 'wait'}"></div>
      </div>
    `).join('');
  }

};
