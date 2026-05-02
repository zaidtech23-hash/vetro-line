// ═══════════════════════════════════════════════════════════════
// MÓDULO: CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════
// Preços de alumínio, peso de barra, valores de serviços
// ═══════════════════════════════════════════════════════════════

const Configuracoes = {

  async load() {
    const { data, error } = await sb
      .from('org_settings')
      .select('*')
      .eq('organization_id', APP_STATE.organization.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
      Utils.toast('Erro ao carregar configurações', 'error');
      return;
    }

    // Se não existir, cria
    let settings = data;
    if (!settings) {
      const { data: newData } = await sb
        .from('org_settings')
        .insert({ organization_id: APP_STATE.organization.id })
        .select()
        .single();
      settings = newData;
    }

    // Preenche campos
    const fields = [
      'aluminio_branco_metro','aluminio_preto_metro','aluminio_bronze_metro','aluminio_fosco_metro',
      'peso_barra_6m','peso_barra_3m',
      'preco_janela','preco_porta','preco_box','preco_espelho','preco_espelho_led',
      'preco_vitrine','preco_porta_correr','preco_mao_obra_hora',
      'fornecedor_principal','observacoes'
    ];
    
    fields.forEach(f => {
      const el = document.getElementById('cfg_' + f);
      if (el && settings[f] !== null && settings[f] !== undefined) {
        el.value = settings[f];
      }
    });
  },

  async save() {
    const payload = {
      organization_id: APP_STATE.organization.id,
      aluminio_branco_metro: parseFloat(document.getElementById('cfg_aluminio_branco_metro').value) || 0,
      aluminio_preto_metro: parseFloat(document.getElementById('cfg_aluminio_preto_metro').value) || 0,
      aluminio_bronze_metro: parseFloat(document.getElementById('cfg_aluminio_bronze_metro').value) || 0,
      aluminio_fosco_metro: parseFloat(document.getElementById('cfg_aluminio_fosco_metro').value) || 0,
      peso_barra_6m: parseFloat(document.getElementById('cfg_peso_barra_6m').value) || 0,
      peso_barra_3m: parseFloat(document.getElementById('cfg_peso_barra_3m').value) || 0,
      preco_janela: parseFloat(document.getElementById('cfg_preco_janela').value) || 0,
      preco_porta: parseFloat(document.getElementById('cfg_preco_porta').value) || 0,
      preco_box: parseFloat(document.getElementById('cfg_preco_box').value) || 0,
      preco_espelho: parseFloat(document.getElementById('cfg_preco_espelho').value) || 0,
      preco_espelho_led: parseFloat(document.getElementById('cfg_preco_espelho_led').value) || 0,
      preco_vitrine: parseFloat(document.getElementById('cfg_preco_vitrine').value) || 0,
      preco_porta_correr: parseFloat(document.getElementById('cfg_preco_porta_correr').value) || 0,
      preco_mao_obra_hora: parseFloat(document.getElementById('cfg_preco_mao_obra_hora').value) || 0,
      fornecedor_principal: document.getElementById('cfg_fornecedor_principal').value.trim(),
      observacoes: document.getElementById('cfg_observacoes').value.trim()
    };

    const { error } = await sb
      .from('org_settings')
      .update(payload)
      .eq('organization_id', APP_STATE.organization.id);

    if (error) {
      Utils.toast('Erro: ' + error.message, 'error');
      return;
    }

    Utils.toast('Configurações salvas! ✅');
  }

};
