// ═══════════════════════════════════════════════════════════════
// MÓDULO: PLANOS DE CORTE
// ═══════════════════════════════════════════════════════════════
// Lista as OS que têm cortes cadastrados e gera uma página
// impressa/PDF com a lista de cortes pra levar pra oficina.
// ═══════════════════════════════════════════════════════════════

const PlanosCorte = {

  filterWorker: '',

  async load() {
    const isWorker = App.isWorker();

    if (isWorker) {
      const filterRow = document.getElementById('planosFilters');
      if (filterRow) filterRow.style.display = 'none';
    } else {
      await this.loadWorkersFilter();
    }

    let query = sb
      .from('service_orders')
      .select('id, os_number, title, status, due_date, clients(name, city), profiles!service_orders_worker_id_fkey(name), cuts(id)')
      .in('status', ['pending', 'in_production', 'in_field']);

    if (isWorker) {
      query = query.eq('worker_id', APP_STATE.user.id);
    } else if (this.filterWorker) {
      query = query.eq('worker_id', this.filterWorker);
    }

    const { data, error } = await query.order('due_date', { ascending: true });

    const container = document.getElementById('planosList');
    if (!container) return;

    if (error) {
      container.innerHTML = `<div class="text-center text-danger" style="padding: 40px;">Erro: ${error.message}</div>`;
      return;
    }

    const comCortes = (data || []).filter(os => (os.cuts || []).length > 0);

    if (comCortes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">✂️</div>
          <div class="title">Nenhum plano de corte disponível</div>
          <div class="sub">${isWorker ? 'Quando o chefe enviar uma OS com cortes, aparece aqui pra você imprimir.' : 'Adicione cortes nas OS pra ver os planos aqui.'}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = comCortes.map(os => `
      <div class="os-mobile-card" onclick="PlanosCorte.abrirPlano('${os.id}')">
        <div class="os-mobile-head">
          <div>
            <div class="os-mobile-number">${os.os_number || 'OS'}</div>
            <div class="os-mobile-title">${os.title}</div>
          </div>
          <div class="tag ${os.status}">${Utils.statusLabel(os.status)}</div>
        </div>
        <div class="os-mobile-info">
          ${os.clients?.name ? `<div>👤 ${os.clients.name}</div>` : ''}
          ${os.clients?.city ? `<div>📍 ${os.clients.city}</div>` : ''}
          ${!isWorker && os.profiles?.name ? `<div>👷 ${os.profiles.name}</div>` : ''}
          ${os.due_date ? `<div>📅 ${Utils.formatDate(os.due_date)}</div>` : ''}
          <div>✂️ ${os.cuts.length} corte(s) cadastrado(s)</div>
        </div>
        <button class="btn-primary" style="margin-top: 12px; width: 100%;">
          📄 Ver Plano de Corte
        </button>
      </div>
    `).join('');
  },

  async loadWorkersFilter() {
    const sel = document.getElementById('planosWorkerFilter');
    if (!sel) return;

    const { data } = await sb
      .from('profiles')
      .select('id, name')
      .eq('role', 'worker')
      .order('name');

    sel.innerHTML = '<option value="">— Todos os funcionários —</option>' +
      (data || []).map(w => `<option value="${w.id}" ${this.filterWorker === w.id ? 'selected' : ''}>${w.name}</option>`).join('');
  },

  filterByWorker(workerId) {
    this.filterWorker = workerId;
    this.load();
  },

  async abrirPlano(osId) {
    const { data: os, error: osErr } = await sb
      .from('service_orders')
      .select('id, os_number, title, description, due_date, clients(name, address, city, phone), profiles!service_orders_worker_id_fkey(name)')
      .eq('id', osId)
      .single();

    if (osErr || !os) {
      Utils.toast('Erro ao carregar OS', 'error');
      return;
    }

    const { data: cuts, error: cutsErr } = await sb
      .from('cuts')
      .select('*')
      .eq('service_order_id', osId)
      .order('material')
      .order('comprimento');

    if (cutsErr) {
      Utils.toast('Erro ao carregar cortes', 'error');
      return;
    }

    this.renderPlano(os, cuts || []);
    Utils.openModal('planoCorteModal');
  },

  renderPlano(os, cuts) {
    // Agrupa cortes por material+cor
    const grupos = {};
    cuts.forEach(c => {
      const key = `${c.material || '—'}__${c.cor || ''}`;
      if (!grupos[key]) {
        grupos[key] = { material: c.material || '—', cor: c.cor || '', itens: [] };
      }
      grupos[key].itens.push(c);
    });

    const totalPecas = cuts.reduce((s, c) => s + (Number(c.quantidade) || 0), 0);
    const totalMetros = cuts.reduce((s, c) => s + (Number(c.comprimento) || 0) * (Number(c.quantidade) || 0), 0);

    const today = new Date().toLocaleDateString('pt-BR');

    document.getElementById('planoCorteContent').innerHTML = `
      <div class="plano-corte-print">

        <div class="plano-cabecalho">
          <div class="plano-titulo">📄 PLANO DE CORTE</div>
          <div class="plano-empresa">${APP_STATE.organization?.name || 'VetroLine'}</div>
        </div>

        <div class="plano-info">
          <div class="plano-info-linha">
            <span class="plano-info-label">OS:</span>
            <span class="plano-info-valor">${os.os_number || '—'} — ${os.title}</span>
          </div>
          ${os.clients?.name ? `
            <div class="plano-info-linha">
              <span class="plano-info-label">Cliente:</span>
              <span class="plano-info-valor">${os.clients.name}</span>
            </div>
          ` : ''}
          ${os.clients?.address || os.clients?.city ? `
            <div class="plano-info-linha">
              <span class="plano-info-label">Endereço:</span>
              <span class="plano-info-valor">${[os.clients.address, os.clients.city].filter(Boolean).join(' — ')}</span>
            </div>
          ` : ''}
          ${os.profiles?.name ? `
            <div class="plano-info-linha">
              <span class="plano-info-label">Funcionário:</span>
              <span class="plano-info-valor">${os.profiles.name}</span>
            </div>
          ` : ''}
          ${os.due_date ? `
            <div class="plano-info-linha">
              <span class="plano-info-label">Vencimento:</span>
              <span class="plano-info-valor">${Utils.formatDate(os.due_date)}</span>
            </div>
          ` : ''}
          <div class="plano-info-linha">
            <span class="plano-info-label">Impresso:</span>
            <span class="plano-info-valor">${today}</span>
          </div>
        </div>

        ${Object.values(grupos).map(g => `
          <div class="plano-grupo">
            <div class="plano-grupo-titulo">
              ${g.material}${g.cor ? ' — ' + g.cor : ''}
            </div>
            <table class="plano-tabela">
              <thead>
                <tr>
                  <th style="width: 40px;">✓</th>
                  <th style="width: 60px;">Qtd</th>
                  <th>Comprimento</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${g.itens.map(c => `
                  <tr class="${c.done ? 'cut-done-row' : ''}">
                    <td class="plano-check">${c.done ? '✓' : '☐'}</td>
                    <td class="plano-qtd"><strong>${c.quantidade}x</strong></td>
                    <td class="plano-comp"><strong>${Number(c.comprimento).toFixed(2).replace('.', ',')} m</strong></td>
                    <td class="plano-obs">${c.observacoes || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="plano-grupo-resumo">
              Subtotal: ${g.itens.reduce((s, c) => s + (Number(c.quantidade) || 0), 0)} peça(s) ·
              ${g.itens.reduce((s, c) => s + (Number(c.comprimento) || 0) * (Number(c.quantidade) || 0), 0).toFixed(2).replace('.', ',')} m
            </div>
          </div>
        `).join('')}

        <div class="plano-total">
          <strong>TOTAL GERAL:</strong> ${totalPecas} peça(s) · ${totalMetros.toFixed(2).replace('.', ',')} metro(s)
        </div>

        ${os.description ? `
          <div class="plano-observacoes">
            <strong>📝 Observações da OS:</strong><br>
            ${os.description}
          </div>
        ` : ''}

        <div class="plano-rodape">
          Gerado por VetroLine em ${today}
        </div>
      </div>
    `;
  },

  imprimir() {
    window.print();
  }

};
