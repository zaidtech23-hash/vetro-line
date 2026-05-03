// ═══════════════════════════════════════════════════════════════
// MÓDULO: CORTES DE ALUMÍNIO
// ═══════════════════════════════════════════════════════════════
// Chefe cria a lista de cortes pra cada OS
// Funcionário marca quando cortou
// ═══════════════════════════════════════════════════════════════

const Cortes = {

  currentOSId: null,
  editingId: null,

  async loadForOS(osId) {
    this.currentOSId = osId;

    const { data, error } = await sb
      .from('cuts')
      .select('*')
      .eq('service_order_id', osId)
      .order('created_at');

    const container = document.getElementById('cutsList');
    if (!container) return;

    if (error || !data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">✂️</div>
          <div class="title">Nenhum corte cadastrado</div>
          <div class="sub">${App.isAdmin() ? 'Adicione os cortes que precisa fazer' : 'Aguarde o chefe enviar a lista'}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(cut => `
      <div class="cut-item ${cut.done ? 'done' : ''}">
        <div class="cut-checkbox ${cut.done ? 'checked' : ''}" onclick="Cortes.toggleDone('${cut.id}', ${!cut.done})">
          ${cut.done ? '✓' : ''}
        </div>
        <div class="cut-info">
          <div class="cut-material">${cut.material}${cut.cor ? ' — ' + cut.cor : ''}</div>
          <div class="cut-spec">${cut.comprimento}m · ${cut.observacoes || ''}</div>
        </div>
        <div class="cut-qty">${cut.quantidade}x</div>
        ${App.isAdmin() ? `
          <button class="icon-btn" onclick="Cortes.edit('${cut.id}')" title="Editar">✏️</button>
          <button class="icon-btn danger" onclick="Cortes.delete('${cut.id}')" title="Deletar">🗑️</button>
        ` : ''}
      </div>
    `).join('');
  },

  async toggleDone(id, newDone) {
    const update = { done: newDone };
    if (newDone) {
      update.done_at = new Date().toISOString();
      update.done_by = APP_STATE.user.id;
    } else {
      update.done_at = null;
      update.done_by = null;
    }

    const { error } = await sb.from('cuts').update(update).eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    
    Utils.toast(newDone ? '✅ Corte marcado como feito!' : 'Corte desmarcado');
    if (this.currentOSId) await this.loadForOS(this.currentOSId);
  },

  openNew() {
    this.editingId = null;
    document.getElementById('cutModalTitle').textContent = 'Novo Corte';
    Utils.clearForm('cutForm');
    document.getElementById('cut_quantidade').value = 1;
    Utils.openModal('cutModal');
  },

  async edit(id) {
    const { data, error } = await sb.from('cuts').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro', 'error'); return; }

    this.editingId = id;
    document.getElementById('cutModalTitle').textContent = 'Editar Corte';
    document.getElementById('cut_material').value = data.material || '';
    document.getElementById('cut_cor').value = data.cor || '';
    document.getElementById('cut_comprimento').value = data.comprimento || '';
    document.getElementById('cut_quantidade').value = data.quantidade || 1;
    document.getElementById('cut_observacoes').value = data.observacoes || '';
    Utils.openModal('cutModal');
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      service_order_id: this.currentOSId,
      material: document.getElementById('cut_material').value.trim(),
      cor: document.getElementById('cut_cor').value.trim(),
      comprimento: parseFloat(document.getElementById('cut_comprimento').value) || 0,
      quantidade: parseInt(document.getElementById('cut_quantidade').value) || 1,
      observacoes: document.getElementById('cut_observacoes').value.trim()
    };

    if (!payload.material) { Utils.toast('Material obrigatório', 'error'); return; }

    let result;
    if (this.editingId) {
      result = await sb.from('cuts').update(payload).eq('id', this.editingId);
    } else {
      result = await sb.from('cuts').insert(payload);
    }

    if (result.error) { Utils.toast('Erro: ' + result.error.message, 'error'); return; }

    Utils.toast(this.editingId ? 'Corte atualizado!' : 'Corte adicionado!');
    Utils.closeModal('cutModal');
    if (this.currentOSId) await this.loadForOS(this.currentOSId);
  },

  async delete(id) {
    if (!await Utils.confirm('Deletar esse corte?')) return;
    const { error } = await sb.from('cuts').delete().eq('id', id);
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }
    Utils.toast('Corte deletado');
    if (this.currentOSId) await this.loadForOS(this.currentOSId);
  }

};
