# 🗺️ Roadmap do VetroLine

O que **JÁ TÁ FUNCIONANDO** e o que **VEM POR AÍ**.

---

## ✅ Sprint 1 — CONCLUÍDO

- [x] Banco de dados PostgreSQL no Supabase
- [x] Autenticação (login/logout)
- [x] Multi-tenant com RLS (Row Level Security)
- [x] Dashboard com estatísticas reais
- [x] CRUD completo: Clientes, Produtos, Estoque, Ordens de Serviço, Orçamentos, Transações
- [x] Geração de PDF de orçamento (versão básica)
- [x] Gestão de funcionários (visualização)
- [x] Design responsivo (funciona no celular)

---

## 🚧 Sprint 2 — PRÓXIMO (1-2 semanas)

### Melhorias críticas
- [ ] **Cadastro de empresa novo** — qualquer vidraçaria poder se cadastrar sozinha (signup)
- [ ] **Convite de funcionários por email** — admin manda email, funcionário cria senha
- [ ] **Recuperação de senha** — "Esqueci minha senha"
- [ ] **Validações nos formulários** — telefone, email, CPF/CNPJ
- [ ] **Filtros e busca** nas tabelas (por nome, status, data)
- [ ] **Paginação** nas tabelas (carregar 20 por vez, não tudo)

### Funcionalidades novas
- [ ] **Itens de orçamento detalhados** — adicionar linha por linha (produto + quantidade + preço)
- [ ] **Converter orçamento em OS** com 1 clique
- [ ] **Movimentação de estoque** — registrar entradas e saídas, gerar histórico
- [ ] **Anexar fotos na OS** — upload pro Supabase Storage
- [ ] **Checklist na OS** — funcionário marca etapas (medição, corte, instalação)

---

## 🚀 Sprint 3 — DIFERENCIAL (1 mês)

### O que vai te separar dos concorrentes
- [ ] **Otimização de corte de alumínio** — algoritmo que minimiza desperdício de barras
- [ ] **App mobile (PWA)** — funcionário acessa do celular, foto in-loco, GPS
- [ ] **Integração WhatsApp** — enviar orçamento direto pro WhatsApp do cliente
- [ ] **Dashboard com gráficos** — Chart.js mostrando faturamento mês a mês, top clientes, etc
- [ ] **Notificações push** — funcionário recebe nova OS, chefe vê quando vai concluir
- [ ] **Calendário/Agenda** — visualizar OS por dia/semana

---

## 💎 Sprint 4 — MONETIZAÇÃO (1-2 meses)

### Quando começar a cobrar
- [ ] **Landing page de vendas** (vetroline.com.br) — hospedar separadamente, atrair clientes
- [ ] **Sistema de planos** — Trial 14 dias → Basic R$49/mês → Pro R$99/mês → Enterprise R$199/mês
- [ ] **Integração Asaas** (recomendado para BR) — cobrança recorrente automática
- [ ] **Limites por plano** — Basic até 50 clientes, Pro ilimitado, etc
- [ ] **Painel super-admin** — tu vê todas as vidraçarias clientes, suas mensalidades, etc
- [ ] **Onboarding** — primeira vez do cliente, tutorial guiado

---

## 🌟 Sprint 5 — IA E AVANÇADO (futuro)

### Coisas que vão impressionar
- [ ] **Assistente de voz com IA** (Claude/OpenAI) — funcionário fala "criar OS box vidro 8mm Rua das Flores 45 cliente Marcos prazo amanhã" e a IA cria
- [ ] **Geração automática de orçamento** — sobe foto da janela existente, IA mede e estima preço
- [ ] **NFS-e (Nota Fiscal de Serviço)** — emissão automática para qualquer cidade do Brasil
- [ ] **Integração com fornecedores** — preço de alumínio Alcoa/CBA em tempo real
- [ ] **Marketplace de pedreiros** — vidraçaria conecta com instaladores parceiros
- [ ] **Análise preditiva** — IA prevê quando estoque vai acabar, quanto vai faturar

---

## 📊 Como decidir o que fazer primeiro

**Pergunta sempre:** "Isso resolve uma dor REAL de uma vidraçaria que tu conhece?"

Se sim → faz.  
Se é só legal de ter → deixa pra depois.

**Prioridade absoluta:** colocar 1 vidraçaria de verdade usando o sistema. As features novas têm que vir do feedback dela, não de palpite.

---

## 🎯 Metas sugeridas

| Mês | Meta |
|-----|------|
| **1** | Sistema online, 1 vidraçaria amiga testando grátis |
| **2** | 3-5 vidraçarias usando, todas grátis (beta) |
| **3** | Lançamento pago: 2-3 clientes pagantes |
| **6** | 10 clientes pagantes (~R$1k/mês) |
| **12** | 50 clientes pagantes (~R$5k/mês) |
| **24** | 200+ clientes (~R$20k/mês) |

Não desanima se demorar mais. Os primeiros clientes são os mais difíceis. Depois vira bola de neve.

---

**Vai com calma e sem pressa. SaaS bom não se faz em 1 mês.** 🐢🚀
