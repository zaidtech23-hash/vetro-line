// ═══════════════════════════════════════════════════════════════
// MÓDULO: HISTÓRICO — Serviços já concluídos
// ═══════════════════════════════════════════════════════════════

const Historico = {
  
  filterWorker: '', // pra admin filtrar por funcionário
  
  async list() {
    const isWorker = APP_STATE.profile?.role === 'worker';
    
    // Se for ADMIN, carrega lista de funcionários pro filtro
    if (!isWorker) {
      await this.loadWorkersFilter();
    } else {
      const filterRow = document.getElementById('historicoFilters');
      if (filterRow) filterRow.style.display = 'none';
    }
    
    let query = sb
      .from('service_orders')
      .select('id, os_number, title, status, due_date, total, updated_at, photos, clients(name, address, city), profiles!service_orders_worker_id_fkey(name)')
      .in('status', ['done', 'cancelled'])
      .order('updated_at', { ascending: false });
    
    // Worker: só vê os DELE
    if (isWorker) {
      query = query.eq('worker_id', APP_STATE.user.id);
    }
    
    // Admin: filtro por funcionário (se selecionado)
    if (!isWorker && this.filterWorker) {
      query = query.eq('worker_id', this.filterWorker);
    }
    
    const { data, error } = await query;
    
    const container = document.getElementById('historicoList');
    if (!container) return;
    
    if (error) {
      container.innerHTML = `<div class="text-center text-danger" style="padding: 40px;">Erro: ${error.message}</div>`;
      return;
    }
    
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📚</div>
          <div class="title">Nenhum serviço no histórico</div>
          <div class="sub">${isWorker ? 'Quando concluir uma OS, vai aparecer aqui' : 'Aguarde os funcionários concluírem serviços'}</div>
        </div>
      `;
      return;
    }
    
    // Estatísticas (só pra admin)
    let statsHtml = '';
    if (!isWorker) {
      const total = data.length;
      const totalDone = data.filter(o => o.status === 'done').length;
      const totalRevenue = data.filter(o => o.status === 'done').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
      statsHtml = `
        <div class="stats-grid" style="margin-bottom: 16px;">
          <div class="stat-card"><div class="stat-icon">📊</div><div><div class="stat-value">${total}</div><div class="stat-label">Total no histórico</div></div></div>
          <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-value">${totalDone}</div><div class="stat-label">Concluídos</div></div></div>
          <div class="stat-card"><div class="stat-icon">💰</div><div><div class="stat-value">${Utils.money(totalRevenue)}</div><div class="stat-label">Faturado</div></div></div>
        </div>
      `;
    }
    
    container.innerHTML = statsHtml + data.map(os => {
      const photos = os.photos || [];
      const photosCount = photos.length;
      const isCanceled = os.status === 'cancelled';
      
      return `
        <div class="os-mobile-card historico-card ${isCanceled ? 'cancelled' : ''}" onclick="${isWorker ? `MinhasOS.openDetail('${os.id}')` : `Ordens.openEdit('${os.id}')`}">
          <div class="os-mobile-head">
            <div>
              <div class="os-mobile-number">${os.os_number || 'OS'}</div>
              <div class="os-mobile-title">${os.title}</div>
            </div>
            <div class="tag ${os.status}">${Utils.statusLabel(os.status)}</div>
          </div>
          <div class="os-mobile-info">
            ${os.clients?.name ? `<div>👤 ${os.clients.name}</div>` : ''}
            ${!isWorker && os.profiles?.name ? `<div>👷 ${os.profiles.name}</div>` : ''}
            ${os.clients?.city ? `<div>📍 ${os.clients.city}</div>` : ''}
            <div>✅ ${Utils.formatDate(os.updated_at?.split('T')[0])}</div>
            ${photosCount > 0 ? `<div>📸 ${photosCount} foto(s)</div>` : ''}
            ${!isWorker && os.total ? `<div>💰 ${Utils.money(os.total)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },
  
  async loadWorkersFilter() {
    const select = document.getElementById('historicoWorkerFilter');
    if (!select) return;
    
    if (select.options.length > 1) return; // Já carregado
    
    const { data } = await sb.from('profiles').select('id, name, role').order('name');
    
    if (data) {
      data.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.role === 'worker' ? '👷' : p.role === 'admin' ? '👑' : '👔'} ${p.name}`;
        select.appendChild(opt);
      });
    }
  },
  
  filterByWorker(workerId) {
    this.filterWorker = workerId;
    this.list();
  }
  
};
