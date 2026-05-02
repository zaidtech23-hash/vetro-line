# 🚀 Como Publicar o VetroLine Online

Hoje, teu sistema só roda no teu computador (via Live Server). Pra teus clientes acessarem em qualquer lugar (do celular, casa, escritório), tu precisa **publicar online**. É grátis e leva 5 minutos.

---

## Opção 1: Netlify (recomendado, mais fácil)

### Passo a passo:

1. **Abre [netlify.com](https://netlify.com)** e cria uma conta grátis (com Google ou email)

2. Depois de logado, na tela inicial vai ter um quadradão escrito **"Drag and drop your site folder here"** (ou similar)

3. **Arrasta a pasta `vetroline` inteira** lá pra dentro

4. Aguarda uns 30 segundos. Pronto! Vai aparecer um link tipo:
   - `https://random-name-123.netlify.app`

5. Acessa o link no celular, no computador, em qualquer lugar — o sistema funciona igual.

### Depois (quando quiser):
- Pode trocar o nome do site (de `random-name-123` pra `vetroline-app` por exemplo) nas configurações
- Pode comprar um domínio próprio tipo `vetroline.com.br` (~R$40/ano no Registro.br) e ligar ao Netlify

---

## Opção 2: Vercel (alternativa, também grátis)

Igual ao Netlify, basicamente. Vai em [vercel.com](https://vercel.com), cria conta, e arrasta a pasta. O link sai em formato `vetroline.vercel.app`.

---

## Opção 3: Cloudflare Pages (mais técnico, mais rápido globalmente)

Tem que ligar ao GitHub, então é mais avançado. Pula essa por enquanto.

---

## ⚠️ Coisas que vão mudar quando publicar

### O Supabase precisa permitir o domínio novo

Quando tu publicar, o site vai estar em `https://teusite.netlify.app` em vez de `localhost`. O Supabase precisa **autorizar** esse novo endereço.

**Como fazer:**
1. Abre o Supabase
2. Vai em **Authentication → URL Configuration**
3. Em **Site URL**, coloca: `https://teusite.netlify.app`
4. Em **Redirect URLs**, adiciona o mesmo
5. Salva

Pronto. Login vai funcionar normalmente no link público.

---

## 🔄 Como atualizar o site depois

Sempre que tu modificar algum arquivo (HTML, CSS, JS) e quiser publicar a nova versão:

### No Netlify:
1. Volta no painel do Netlify
2. Clica no teu site
3. Vai em **Deploys**
4. Arrasta a pasta `vetroline` atualizada de novo
5. Em ~30 segundos a nova versão tá no ar

### Avançado (com Git):
Quando tu tiver mais confiança, dá pra ligar o Netlify ao GitHub, e qualquer mudança que tu fizer no código vai pro ar automaticamente. Mas isso é Sprint avançado, deixa pra depois.

---

## 🌐 Domínio próprio (opcional)

Quando o sistema tiver clientes pagantes, vale comprar um domínio profissional:

1. Vai em [registro.br](https://registro.br) e busca `vetroline.com.br` (ou outro nome)
2. Custa em torno de R$40/ano
3. Depois de comprar, no Netlify tu vai em **Domain settings → Add custom domain**
4. Eles te dão instruções de quais registros DNS configurar no Registro.br
5. Em algumas horas, teu site vira `https://vetroline.com.br`

---

## 💰 Quando começar a cobrar dos clientes

Pra cobrar mensalidade, tu vai precisar integrar **Stripe** ou **Asaas** (recomendo Asaas pra Brasil). Isso é assunto pro **Sprint 4 (Monetização)**. Por enquanto, foca em:

1. Deixar o sistema rodando online
2. Conseguir 1-2 vidraçarias usando GRÁTIS pra testar
3. Quando tiver feedback positivo, aí ligamos cobrança

---

**Próximo passo recomendado:** Arrasta a pasta no Netlify, pega o link, e me manda. Eu te ajudo com o resto. 🚀
