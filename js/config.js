// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO SUPABASE
// ═══════════════════════════════════════════════════════════════
// Aqui ficam as credenciais do banco de dados.
// Se precisar trocar de projeto, é SÓ alterar essas 2 variáveis.
// ═══════════════════════════════════════════════════════════════

const SUPABASE_CONFIG = {
  URL: 'https://hzlrmwyvaqcggqavbxoz.supabase.co',
  KEY: 'sb_publishable_rumoTik-A9teJNFg4hHsZw_4ZXG04WE'
};

// Inicializa o cliente Supabase (variável global usada por todos os módulos)
const sb = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Estado global da aplicação
const APP_STATE = {
  user: null,           // Usuário logado (vem do auth.users)
  profile: null,        // Perfil completo (nome, role)
  organization: null,   // Vidraçaria do usuário
  currentScreen: 'dashboard'
};
