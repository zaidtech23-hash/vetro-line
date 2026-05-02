// ═══════════════════════════════════════════════════════════════
// MÓDULO: FUNCIONÁRIOS
// ═══════════════════════════════════════════════════════════════

const Funcionarios = {

  async load() { await this.list(); },

  async list() {
    const { data, error } = await sb.from('profiles').select('*').order('name');
    const tbody = document.getElementById('funcTableBody');

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">👷</div><div class="title">Nenhum funcionário</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><div class="flex items-center gap-12"><div class="avatar sm">${Auth.getInitials(p.name)}</div><strong>${p.name}</strong></div></td>
        <td>${p.phone || '—'}</td>
        <td><span class="tag ${p.role === 'admin' ? 'done' : p.role === 'manager' ? 'going' : 'pending'}">${Auth.roleLabel(p.role)}</span></td>
        <td>${p.active ? '<span class="text-secondary">✓ Ativo</span>' : '<span class="text-muted">Inativo</span>'}</td>
        <td>${Utils.formatDate(p.created_at?.split('T')[0])}</td>
      </tr>
    `).join('');
  },

  showInviteInfo() {
    alert(`Para adicionar um novo funcionário:

1. Vai no painel do Supabase → Authentication
2. Clica em "Add user" → Create new user
3. Cria com email e senha
4. Volta aqui no SQL Editor e roda:

insert into public.profiles (id, organization_id, name, role)
select id, '${APP_STATE.organization.id}'::uuid, 'Nome do Funcionário', 'worker'
from auth.users where email = 'email@dofuncionario.com';

(Em breve teremos botão pra fazer isso direto pela tela!)`);
  }

};
