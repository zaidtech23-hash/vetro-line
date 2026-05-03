# 📖 Como Usar o VetroLine

Manual passo a passo, em português simples.

---

## 1️⃣ Primeiro acesso

### Abrir o sistema
1. No VS Code, abre a pasta `vetroline`
2. Clica com botão **direito** em `index.html`
3. Escolhe **Open with Live Server**
4. Vai abrir no navegador (geralmente em http://127.0.0.1:5500)

### Fazer login
- Email: o que tu cadastrou no Supabase Authentication
- Senha: a que tu definiu na hora de criar o usuário
- Clica em **Entrar no Sistema →**

---

## 2️⃣ Tela por tela

### 🏠 Dashboard
Mostra resumo do dia:
- Quantos serviços tem hoje
- Quantos foram concluídos
- Quanto faturou no mês
- Alertas de estoque baixo
- Lista de próximos serviços
- Equipe online

### 📋 Ordens (de Serviço)
- **Criar nova OS:** Clica no botão "➕ Nova Ordem" no canto superior direito
- **Editar OS:** Clica no ícone ✏️ ao lado da OS
- **Deletar OS:** Clica no ícone 🗑️ (vai pedir confirmação)
- Pode atribuir cliente, funcionário responsável, status (Pendente/Em campo/Concluído), prioridade, e valor

### ⚡ Orçamentos
- Gera orçamento com cálculo automático (subtotal + mão de obra - desconto = total)
- Botão 📄 gera **PDF profissional** que tu pode imprimir ou enviar pro cliente
- Status: Rascunho → Enviado → Aceito/Rejeitado → Convertido em OS

### 👥 Clientes
- Cadastra todos os clientes da vidraçaria
- Nome, telefone, email, CPF/CNPJ, endereço
- Quando criar OS ou orçamento, escolhe o cliente da lista

### 🏷️ Produtos
- Cadastra os produtos/serviços que tu vende
- Define preço de venda e custo (importante pra calcular margem)
- Categorias: janela, porta, box, espelho, serviço, etc

### 📦 Estoque
- Controla alumínio, vidros, ferragens
- Define **quantidade mínima** — quando o estoque fica abaixo disso, aparece como "⚠️ Estoque baixo" no dashboard
- Registra fornecedor e custo unitário

### 💰 Financeiro
- **Nova Entrada:** registra dinheiro que entrou (pagamentos, sinais)
- **Nova Saída:** registra dinheiro que saiu (compras, salários)
- O saldo do mês é calculado automaticamente
- Categorias livres: obra, sinal, alumínio, vidro, salário, alimentação...

### 👷 Funcionários
- Lista todos os usuários da vidraçaria
- Pra adicionar novo funcionário:
  1. Vai no Supabase → Authentication → Add user
  2. Cria com email e senha
  3. Volta no SQL Editor e roda o SQL pra linkar à tua vidraçaria (o sistema te explica)

---

## 3️⃣ Atalhos úteis

- **Enter** no campo de senha → faz login direto
- **Esc** → fecha qualquer modal aberto
- Em qualquer modal, **clicar fora não fecha** (pra não perder dados sem querer) — usa o botão Cancelar ou X

---

## 4️⃣ Quando algo der errado

### "Erro ao carregar perfil"
→ O usuário existe no Authentication mas não tem profile linkado. Roda o SQL de linkagem (ver README).

### Não aparece nenhum dado
→ Provavelmente o RLS tá bloqueando. Confirma no Supabase que tu tem profile com a `organization_id` correta.

### Botão "Salvar" não faz nada
→ Abre o **Console** do navegador (F12 → aba Console) e copia o erro. Manda pro Claude pra debugar.

### Mudei algo no código e não atualiza
→ Faz **Ctrl + Shift + R** (recarregar sem cache) ou fecha e abre o Live Server de novo.

---

## 5️⃣ Quando quiser melhorar / adicionar coisa

Abre uma conversa nova com Claude e cola:
1. O `README.md`
2. O arquivo do módulo que tu quer modificar (ex: `js/modules/clientes.js`)
3. Explica o que tu quer ("quero que ao deletar cliente, pergunte se quer arquivar ao invés de deletar")

O Claude já vai entender a estrutura e te ajudar.

---

**Bons negócios! 🚀**
