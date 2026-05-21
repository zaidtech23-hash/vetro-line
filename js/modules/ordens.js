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
      <tr onclick="Ordens.edit('${os.id}')" style="cursor: pointer;">
        <td><strong>${os.os_number || '—'}</strong></td>
        <td>${os.title}</td>
        <td>${os.clients?.name || '—'}</td>
        <td>${os.profiles?.name || '<span class="text-muted">Não atribuído</span>'}</td>
        <td>${Utils.formatDate(os.due_date)}</td>
        <td><span class="tag ${os.status}">${Utils.statusLabel(os.status)}</span></td>
        <td class="text-right">${Utils.money(os.total)}</td>
        <td onclick="event.stopPropagation()">
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

    // Esconde o painel de detalhes (só aparece editando)
    const panel = document.getElementById('osDetailPanel');
    if (panel) panel.style.display = 'none';

    Utils.openModal('osModal');
  },

  async edit(id) {
    // Busca tudo da OS + cliente + funcionário
    const { data, error } = await sb
      .from('service_orders')
      .select('*, clients(name, phone, address, city, email), profiles!service_orders_worker_id_fkey(name, phone)')
      .eq('id', id)
      .single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    // Busca cortes da OS
    const { data: cuts } = await sb
      .from('cuts')
      .select('*')
      .eq('service_order_id', id)
      .order('created_at');

    this.editingId = id;
    document.getElementById('osModalTitle').textContent = `${data.os_number || 'OS'} — ${data.title}`;
    document.getElementById('os_number').value = data.os_number || '';
    document.getElementById('os_title').value = data.title || '';
    document.getElementById('os_description').value = data.description || '';
    document.getElementById('os_client').value = data.client_id || '';
    document.getElementById('os_worker').value = data.worker_id || '';
    document.getElementById('os_due_date').value = data.due_date || '';
    document.getElementById('os_status').value = data.status || 'pending';
    document.getElementById('os_priority').value = data.priority || 'normal';
    document.getElementById('os_total').value = data.total || '';

    // Renderiza o painel de detalhes (worker, cliente, fotos, cortes, histórico)
    this.renderDetailPanel(data, cuts || []);

    Utils.openModal('osModal');
  },

  renderDetailPanel(os, cuts) {
    const panel = document.getElementById('osDetailPanel');
    if (!panel) return;

    const worker = os.profiles || {};
    const client = os.clients || {};
    const photos = os.photos || [];
    const cortesFeitos = cuts.filter(c => c.done).length;
    const cortesTotal = cuts.length;
    const totalPecas = cuts.reduce((s, c) => s + (Number(c.quantidade) || 0), 0);
    const totalMetros = cuts.reduce((s, c) => s + (Number(c.comprimento) || 0) * (Number(c.quantidade) || 0), 0);

    const fmt = (dt) => {
      if (!dt) return '—';
      const d = new Date(dt);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const phoneLink = (phone) => {
      if (!phone) return '';
      const clean = phone.replace(/\D/g, '');
      return `<a href="https://wa.me/55${clean}" target="_blank" style="color: var(--secondary); text-decoration: none;">📱 ${phone}</a>`;
    };

    panel.innerHTML = `
      <div class="os-detail-banner">

        <!-- Status atual + datas -->
        <div class="os-detail-section">
          <div class="os-detail-row">
            <span class="tag ${os.status}" style="font-size: 0.85rem;">${Utils.statusLabel(os.status)}</span>
            <span style="color: var(--text-dim); font-size: 0.8rem;">
              Última atualização: ${fmt(os.updated_at)}
            </span>
          </div>
          <div class="os-detail-row" style="margin-top: 6px; color: var(--text-dim); font-size: 0.8rem;">
            Criada em: ${fmt(os.created_at)}
          </div>
        </div>

        <!-- Funcionário responsável -->
        <div class="os-detail-section">
          <div class="os-detail-title">👷 Funcionário</div>
          ${worker.name ? `
            <div><strong>${worker.name}</strong></div>
            ${worker.phone ? `<div style="margin-top: 4px;">${phoneLink(worker.phone)}</div>` : ''}
          ` : '<div style="color: var(--text-dim);">Nenhum funcionário atribuído</div>'}
        </div>

        <!-- Cliente -->
        <div class="os-detail-section">
          <div class="os-detail-title">👤 Cliente</div>
          ${client.name ? `
            <div><strong>${client.name}</strong></div>
            ${client.phone ? `<div style="margin-top: 4px;">${phoneLink(client.phone)}</div>` : ''}
            ${client.email ? `<div style="margin-top: 4px; color: var(--text-dim); font-size: 0.85rem;">📧 ${client.email}</div>` : ''}
            ${client.address || client.city ? `
              <div style="margin-top: 4px; font-size: 0.85rem;">
                📍 ${[client.address, client.city].filter(Boolean).join(' — ')}
                ${client.address ? `<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((client.address || '') + ' ' + (client.city || ''))}" target="_blank" style="color: var(--secondary); font-size: 0.8rem;">🗺️ Abrir no Maps</a>` : ''}
              </div>
            ` : ''}
          ` : '<div style="color: var(--text-dim);">Sem cliente cadastrado</div>'}
        </div>

        <!-- Cortes -->
        <div class="os-detail-section">
          <div class="os-detail-title">✂️ Cortes (${cortesFeitos} de ${cortesTotal} feitos)</div>
          ${cortesTotal === 0 ? `
            <div style="color: var(--text-dim); font-size: 0.85rem;">Nenhum corte cadastrado pra essa OS</div>
          ` : `
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">
              ${totalPecas} peça(s) · ${totalMetros.toFixed(2).replace('.', ',')} m
            </div>
            <div class="os-detail-cuts">
              ${cuts.map(c => `
                <div class="os-detail-cut ${c.done ? 'cut-done' : ''}">
                  <span class="cut-indicator">${c.done ? '✅' : '⬜'}</span>
                  <span class="cut-text"><strong>${c.quantidade}x</strong> ${c.material}${c.cor ? ' ' + c.cor : ''} — ${Number(c.comprimento).toFixed(2).replace('.', ',')}m</span>
                  ${c.observacoes ? `<span class="cut-obs">${c.observacoes}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Fotos do funcionário -->
        <div class="os-detail-section">
          <div class="os-detail-title">📸 Fotos enviadas pelo funcionário</div>
          ${photos.length === 0 ? `
            <div style="color: var(--text-dim); font-size: 0.85rem;">Nenhuma foto enviada ainda</div>
          ` : `
            <div class="photos-grid">
              ${photos.map((url, idx) => `
                <div class="photo-thumb">
                  <img src="${url}" alt="Foto ${idx+1}" onclick="window.open('${url}', '_blank')">
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>

      <div style="margin: 16px 0 4px; padding-top: 12px; border-top: 1px dashed var(--border); color: var(--text-dim); font-size: 0.85rem; font-weight: 700; letter-spacing: 1px;">
        ✏️ EDITAR DADOS DA OS
      </div>
    `;
    panel.style.display = 'block';
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

    // Verifica se mudou o worker (pra avisar funcionário novo)
    let workerChanged = false;
    let oldWorkerId = null;
    if (this.editingId) {
      const { data: oldOS } = await sb.from('service_orders').select('worker_id').eq('id', this.editingId).single();
      oldWorkerId = oldOS?.worker_id;
      workerChanged = oldWorkerId !== payload.worker_id;
    }

    let result;
    let savedOS;
    if (this.editingId) {
      result = await sb.from('service_orders').update(payload).eq('id', this.editingId).select().single();
      savedOS = result.data;
    } else {
      result = await sb.from('service_orders').insert(payload).select().single();
      savedOS = result.data;
    }

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }

    // 🚨 NOTIFICAR FUNCIONÁRIO se atribuiu OS pra ele (caso novo OU mudou worker)
    if (payload.worker_id && (!this.editingId || workerChanged)) {
      try {
        // Busca nome do worker
        const { data: workerProfile } = await sb.from('profiles').select('name').eq('id', payload.worker_id).single();
        
        await sb.from('notifications').insert({
          organization_id: APP_STATE.organization.id,
          recipient_id: payload.worker_id, // notifica especificamente esse worker
          recipient_role: 'worker',
          type: 'new_os_assigned',
          title: `🆕 Nova OS pra você!`,
          message: `${payload.title} — Toque pra ver detalhes`,
          related_id: savedOS.id,
          related_type: 'service_order',
          created_by: APP_STATE.user.id
        });
        
        Utils.toast(`✅ ${workerProfile?.name || 'Funcionário'} foi notificado!`, 'success');
      } catch (notifErr) {
        console.warn('Erro notificando worker:', notifErr);
      }
    } else {
      Utils.toast(this.editingId ? 'OS atualizada!' : 'OS criada!');
    }
    
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
