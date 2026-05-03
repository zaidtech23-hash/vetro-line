// ═══════════════════════════════════════════════════════════════
// MÓDULO: FUNCIONÁRIOS — completo
// ═══════════════════════════════════════════════════════════════
// CRUD completo: cadastrar, editar, bloquear/desbloquear, deletar
// ═══════════════════════════════════════════════════════════════

const Funcionarios = {

  editingId: null,

  async load() { await this.list(); },

  async list() {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .order('name');

    const tbody = document.getElementById('funcTableBody');
    const cardsContainer = document.getElementById('funcCardsList');

    if (error) {
      const html = `<tr><td colspan="6" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      if (tbody) tbody.innerHTML = html;
      return;
    }

    if (!data || data.length === 0) {
      const empty = '<div class="empty-state"><div class="icon">👷</div><div class="title">Nenhum funcionário</div><div class="sub">Clica em "Adicionar Funcionário"</div></div>';
      if (tbody) tbody.innerHTML = `<tr><td colspan="6">${empty}</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = empty;
      return;
    }

    // VERSÃO TABELA (desktop)
    if (tbody) {
      tbody.innerHTML = data.map(p => {
        const isMe = p.id === APP_STATE.user.id;
        const isBlocked = !p.active;
        return `
          <tr class="${isBlocked ? 'row-blocked' : ''}">
            <td>
              <div class="flex items-center gap-12">
                <div class="avatar sm">${Auth.getInitials(p.name)}</div>
                <div>
                  <strong>${p.name}</strong>
                  ${isMe ? '<span class="text-muted" style="font-size:0.7rem;"> (você)</span>' : ''}
                </div>
              </div>
            </td>
            <td>${p.phone || '—'}</td>
            <td><span class="tag ${p.role === 'admin' ? 'done' : p.role === 'manager' ? 'going' : 'pending'}">${Auth.roleLabel(p.role)}</span></td>
            <td>${isBlocked ? '<span class="text-danger">🚫 Bloqueado</span>' : '<span class="text-secondary">✓ Ativo</span>'}</td>
            <td>${Utils.formatDate(p.created_at?.split('T')[0])}</td>
            <td>
              <div class="table-actions">
                ${isMe ? '<span class="text-muted" style="font-size:0.7rem;">—</span>' : `
                  <button class="icon-btn" onclick="Funcionarios.edit('${p.id}')" title="Editar">✏️</button>
                  <button class="icon-btn ${isBlocked ? '' : 'danger'}" onclick="Funcionarios.toggleBlock('${p.id}', ${!isBlocked}, '${p.name.replace(/'/g, "\\'")}')" title="${isBlocked ? 'Desbloquear' : 'Bloquear'}">${isBlocked ? '✅' : '🚫'}</button>
                  <button class="icon-btn danger" onclick="Funcionarios.delete('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Deletar">🗑️</button>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // VERSÃO CARDS (mobile)
    if (cardsContainer) {
      cardsContainer.innerHTML = data.map(p => {
        const isMe = p.id === APP_STATE.user.id;
        const isBlocked = !p.active;
        return `
          <div class="func-mobile-card ${isBlocked ? 'blocked' : ''}">
            <div class="func-mobile-head">
              <div class="avatar">${Auth.getInitials(p.name)}</div>
              <div class="flex-1">
                <div class="func-mobile-name">${p.name}${isMe ? ' <span class="text-muted" style="font-size:0.7rem;">(você)</span>' : ''}</div>
                <div class="func-mobile-role">
                  <span class="tag ${p.role === 'admin' ? 'done' : p.role === 'manager' ? 'going' : 'pending'}">${Auth.roleLabel(p.role)}</span>
                  ${isBlocked ? '<span class="text-danger" style="font-size:0.7rem;"> · 🚫 Bloqueado</span>' : ''}
                </div>
              </div>
            </div>
            ${p.phone ? `<div class="func-mobile-info">📞 ${p.phone}</div>` : ''}
            <div class="func-mobile-info">📅 ${Utils.formatDate(p.created_at?.split('T')[0])}</div>
            ${!isMe ? `
              <div class="func-mobile-actions">
                <button class="btn-secondary" onclick="Funcionarios.edit('${p.id}')">✏️ Editar</button>
                <button class="btn-secondary ${isBlocked ? '' : ''}" onclick="Funcionarios.toggleBlock('${p.id}', ${!isBlocked}, '${p.name.replace(/'/g, "\\'")}')">
                  ${isBlocked ? '✅ Desbloquear' : '🚫 Bloquear'}
                </button>
                <button class="btn-secondary" style="color: var(--danger); border-color: #ef476f30;" onclick="Funcionarios.delete('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                  🗑️ Deletar
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  },

  // ─────────────────────────────────────────────
  // CADASTRAR NOVO
  // ─────────────────────────────────────────────
  openNew() {
    this.editingId = null;
    document.getElementById('funcModalTitle').textContent = '➕ Novo Funcionário';
    Utils.clearForm('funcForm');
    document.getElementById('func_role').value = 'worker';
    
    // Mostra campos de email/senha (só pra novo)
    document.getElementById('funcAuthFields').style.display = 'block';
    document.getElementById('func_email').required = true;
    document.getElementById('func_password').required = true;
    
    Utils.openModal('funcModal');
  },

  // ─────────────────────────────────────────────
  // EDITAR EXISTENTE
  // ─────────────────────────────────────────────
  async edit(id) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).single();
    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }

    this.editingId = id;
    document.getElementById('funcModalTitle').textContent = '✏️ Editar Funcionário';
    document.getElementById('func_name').value = data.name || '';
    document.getElementById('func_phone').value = data.phone || '';
    document.getElementById('func_role').value = data.role || 'worker';
    
    // Esconde campos de email/senha (não dá pra editar pelo client)
    document.getElementById('funcAuthFields').style.display = 'none';
    document.getElementById('func_email').required = false;
    document.getElementById('func_password').required = false;
    
    Utils.openModal('funcModal');
  },

  async save() {
    const name = document.getElementById('func_name').value.trim();
    const phone = document.getElementById('func_phone').value.trim();
    const role = document.getElementById('func_role').value;

    if (!name) { Utils.toast('Nome é obrigatório', 'error'); return; }

    const btn = document.getElementById('funcSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      // EDITANDO
      if (this.editingId) {
        const { error } = await sb
          .from('profiles')
          .update({ name, phone, role })
          .eq('id', this.editingId);

        if (error) throw error;

        Utils.toast(`✅ ${name} atualizado!`);
        Utils.closeModal('funcModal');
        await this.list();
        return;
      }

      // CADASTRANDO NOVO
      const email = document.getElementById('func_email').value.trim();
      const password = document.getElementById('func_password').value.trim();

      if (!email) { Utils.toast('Email é obrigatório', 'error'); return; }
      if (!password) { Utils.toast('Senha é obrigatória', 'error'); return; }
      if (password.length < 6) { Utils.toast('Senha precisa ter pelo menos 6 caracteres', 'error'); return; }

      // Salvar sessão atual do admin
      const { data: { session: adminSession } } = await sb.auth.getSession();

      // Criar usuário
      const { data: signUpData, error: signUpError } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Esse email já tá cadastrado!');
        }
        throw signUpError;
      }

      if (!signUpData.user) throw new Error('Não conseguiu criar o usuário');

      // Restaurar sessão do admin
      if (adminSession) {
        await sb.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token
        });
      }

      // Criar profile
      const { error: profileError } = await sb
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          organization_id: APP_STATE.organization.id,
          name, role, phone,
          active: true
        });

      if (profileError) {
        if (profileError.code === '23505') {
          await sb.from('profiles').update({
            organization_id: APP_STATE.organization.id,
            name, role, phone, active: true
          }).eq('id', signUpData.user.id);
        } else {
          throw profileError;
        }
      }

      Utils.toast(`✅ ${name} cadastrado!`);
      Utils.closeModal('funcModal');
      await this.list();

    } catch (err) {
      console.error(err);
      Utils.toast('Erro: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Salvar';
    }
  },

  // ─────────────────────────────────────────────
  // BLOQUEAR / DESBLOQUEAR
  // ─────────────────────────────────────────────
  async toggleBlock(id, block, name) {
    const action = block ? 'BLOQUEAR' : 'DESBLOQUEAR';
    const msg = block 
      ? `Bloquear "${name}"?\n\nO funcionário não vai conseguir mais entrar no sistema, mas o histórico dele fica salvo.\n\nTu pode desbloquear depois.`
      : `Desbloquear "${name}"?\n\nEle vai poder entrar no sistema de novo.`;

    if (!await Utils.confirm(msg)) return;

    const { error } = await sb
      .from('profiles')
      .update({ active: !block })
      .eq('id', id);

    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }

    Utils.toast(block ? `🚫 ${name} bloqueado` : `✅ ${name} desbloqueado`);
    await this.list();
  },

  // ─────────────────────────────────────────────
  // DELETAR (com confirmação dupla)
  // ─────────────────────────────────────────────
  async delete(id, name) {
    // PRIMEIRA confirmação
    if (!await Utils.confirm(`⚠️ ATENÇÃO!\n\nDeletar funcionário "${name}"?\n\nIsso é PERMANENTE. Vai apagar:\n- Cadastro do funcionário\n- Vínculo com OSs (mas as OSs ficam)\n\nSe for só pra impedir o acesso, use BLOQUEAR (mais seguro).`)) return;

    // SEGUNDA confirmação
    if (!await Utils.confirm(`Tem CERTEZA que quer DELETAR "${name}" pra sempre?\n\nEssa ação não pode ser desfeita!`)) return;

    // Deleta o profile (não dá pra deletar o auth.users via client, fica órfão mas tudo bem)
    const { error } = await sb
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) { Utils.toast('Erro: ' + error.message, 'error'); return; }

    Utils.toast(`🗑️ ${name} deletado`);
    await this.list();
  }

};
