# 🏗️ VetroLine

Sistema SaaS de gestão para vidraçarias e fábricas de esquadrias (alumínio, vidro, PVC).

---

## 📋 O que esse sistema faz

- ✅ **Login multi-usuário** com perfis (Admin / Gerente / Funcionário)
- ✅ **Multi-tenant** — cada vidraçaria com dados isolados
- ✅ **Dashboard** com estatísticas em tempo real
- ✅ **Ordens de Serviço** — criar, atribuir, acompanhar status
- ✅ **Orçamentos** — gerar PDF profissional, controle de status
- ✅ **Clientes** — base completa com histórico
- ✅ **Catálogo de produtos** — preços e custos
- ✅ **Controle de estoque** — alertas de estoque baixo
- ✅ **Financeiro** — entradas, saídas, saldo do mês
- ✅ **Funcionários** — gestão da equipe

---

## 🗂️ Estrutura do projeto

```
vetroline/
├── index.html              ← Página principal (abre essa no navegador)
├── css/
│   └── style.css           ← Todos os estilos (cores, layout, etc)
├── js/
│   ├── config.js           ← Credenciais do Supabase
│   ├── auth.js             ← Login/logout
│   ├── app.js              ← Controlador principal
│   ├── modules/            ← Cada funcionalidade tem seu arquivo
│   │   ├── dashboard.js
│   │   ├── ordens.js
│   │   ├── clientes.js
│   │   ├── produtos.js
│   │   ├── estoque.js
│   │   ├── orcamentos.js
│   │   ├── financeiro.js
│   │   └── funcionarios.js
│   └── utils/
│       └── helpers.js      ← Funções auxiliares (formatação, etc)
├── database/
│   └── schema.sql          ← SQL completo do banco (rodar no Supabase)
└── docs/
    ├── COMO-USAR.md        ← Manual passo a passo
    ├── DEPLOY.md           ← Como publicar online
    └── ROADMAP.md          ← Próximos passos
```

---

## 🚀 Como começar (3 passos)

### 1. Criar o banco de dados (5 minutos)

1. Abre [supabase.com](https://supabase.com) e faz login no teu projeto VetroLine
2. Vai em **SQL Editor**
3. Abre o arquivo `database/schema.sql`, copia TUDO, cola no editor
4. Clica em **Run**

✅ Pronto — banco configurado com 9 tabelas e dados de exemplo.

### 2. Criar teu usuário (2 minutos)

1. No Supabase, vai em **Authentication → Users**
2. Clica em **Add user → Create new user**
3. Coloca teu email e senha (marca "Auto Confirm User")
4. Volta no SQL Editor e roda esse SQL (trocando o email):

```sql
insert into public.profiles (id, organization_id, name, role, phone)
select id, '00000000-0000-0000-0000-000000000001'::uuid, 'Seu Nome', 'admin', '(00) 00000-0000'
from auth.users where email = 'SEU_EMAIL_AQUI@gmail.com';
```

### 3. Abrir o sistema

1. No VS Code, instala a extensão **Live Server** (Ritwick Dey)
2. Clica com o botão direito em `index.html` → **Open with Live Server**
3. Vai abrir o sistema no navegador
4. Faz login com teu email e senha 🎉

---

## ⚙️ Como editar / personalizar

### Trocar cores
Edita `css/style.css`, lá no topo tem essa parte:

```css
:root {
  --primary: #00c9ff;     /* Cor principal (ciano) */
  --secondary: #06d6a0;   /* Cor secundária (verde) */
  --danger: #ef476f;      /* Vermelho (alertas) */
  --warning: #ffd93d;     /* Amarelo */
  /* ... */
}
```

Troca os códigos de cor (formato `#RRGGBB`) e tudo no app muda automaticamente.

### Trocar logo / nome
Procura "VetroLine" em:
- `index.html` (linha do `<title>` e onde aparece "VetroLine" no logo)
- `css/style.css` (classe `.logo` e `.nav-logo`)

### Adicionar novo módulo
1. Cria arquivo em `js/modules/novomodulo.js`
2. Inclui no `index.html` perto do final dos `<script>`
3. Adiciona uma nova tab no top-nav
4. Cria uma `<div id="screen-novomodulo" class="screen">` 

---

## 🔐 Como funciona o multi-tenant

Cada vidraçaria que se cadastrar no VetroLine vai ter uma linha na tabela `organizations`. Todo dado (clientes, OS, orçamentos, etc) tem um campo `organization_id` que aponta para a organização dona daquele dado.

O **Row Level Security (RLS)** do PostgreSQL garante que: quando o usuário X está logado, ele SÓ consegue ver/editar dados onde `organization_id` é igual ao da vidraçaria dele. Isso é **automático** e à prova de bug — mesmo que um hacker tente burlar pelo navegador, o banco bloqueia.

---

## 📞 Suporte

Quando tiver dúvida, copiar erro, ou precisar adicionar funcionalidade nova, abre uma conversa nova com o Claude e cola este projeto. O Claude já entende a estrutura inteira.

---

**Feito por Eliab Zaid · 2026**
