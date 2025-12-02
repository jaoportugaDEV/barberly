# ⚡ Quick Start - Sistema de Pagamentos Barberly

## 🎯 O que foi feito?

Integrei um **sistema completo de pagamentos com Stripe** no seu Barberly, incluindo:

✅ **Trial gratuito de 7 dias** sem necessidade de cartão  
✅ **Assinatura mensal de €20** via Stripe  
✅ **Bloqueio automático** após trial/cancelamento  
✅ **Portal de gerenciamento** de assinaturas  
✅ **Webhooks** para sincronização automática  

---

## 🚀 Para Começar AGORA (5 minutos)

### 1️⃣ Criar Conta no Stripe (2 min)

1. Acesse: https://stripe.com
2. Crie uma conta (ou faça login)
3. Ative o **modo de teste** (botão no canto superior direito)

### 2️⃣ Configurar Produto no Stripe (2 min)

1. No Stripe, vá em **Products** → **Add Product**
2. Preencha:
   - **Name**: `Barberly Premium`
   - **Price**: `20.00 EUR`
   - **Billing**: `Monthly`
3. Clique em **Save**
4. **Copie o Price ID** (começa com `price_xxx`)

### 3️⃣ Configurar Variáveis de Ambiente (1 min)

1. No Stripe, vá em **Developers** → **API Keys**
2. Copie as chaves
3. Crie o arquivo `.env.local` na raiz do projeto:

```env
# Suas variáveis existentes do Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui

# NOVAS - Adicione estas do Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx

# URL do seu app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4️⃣ Criar Tabela no Supabase (30 seg)

1. Acesse seu painel do Supabase
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase/subscriptions.sql`

### 5️⃣ Testar! (30 seg)

```bash
npm run dev
```

Acesse `http://localhost:3000` e teste o fluxo!

---

## 🧪 Testar com Cartão de Teste

Use este cartão no checkout:

```
Número: 4242 4242 4242 4242
Data: 12/34 (qualquer futura)
CVC: 123 (qualquer 3 dígitos)
ZIP: 12345 (qualquer)
```

✅ Este cartão sempre aprova o pagamento!

---

## 🔄 Fluxo do Usuário

```
1. Usuário acessa o site
   ↓
2. Faz login
   ↓
3. É direcionado para /trial
   ↓
4. Escolhe: Trial gratuito OU Assinar
   ↓
5a. Trial: Usa grátis por 7 dias
5b. Assinar: Paga e tem acesso imediato
   ↓
6. Após 7 dias (se trial): Precisa assinar para continuar
```

---

## ⚙️ Configurar Webhooks (Opcional - mas recomendado)

### Para Desenvolvimento Local:

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Execute:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
3. Copie o webhook secret que aparecer
4. Adicione ao `.env.local` como `STRIPE_WEBHOOK_SECRET`

### Para Produção:

1. No Stripe, vá em **Developers** → **Webhooks**
2. Adicione endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Selecione eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Copie o signing secret
5. Adicione ao ambiente de produção

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `STRIPE_SETUP.md` | 📖 Guia completo de configuração |
| `RESUMO_INTEGRACAO.md` | 📋 Visão geral técnica |
| `CHANGELOG.md` | 📝 Histórico de mudanças |
| `supabase/subscriptions.sql` | 🗄️ Script SQL da tabela |

---

## 🎨 Páginas Novas

| Rota | O que é |
|------|---------|
| `/trial` | Escolher trial gratuito ou assinar |
| `/assinatura` | Página de checkout e gerenciamento |
| `/signup` | Completar perfil (após trial/assinatura) |

---

## 🎯 Checklist de Deploy

Para colocar em produção:

- [ ] Criar produto no Stripe (modo LIVE)
- [ ] Copiar chaves LIVE do Stripe
- [ ] Configurar webhooks em produção
- [ ] Atualizar variáveis de ambiente no Vercel/Netlify
- [ ] Testar fluxo completo em produção
- [ ] Configurar domínio customizado (se necessário)

---

## ❓ Problemas Comuns

### "Não encontra a tabela subscriptions"
➡️ Execute o SQL em `supabase/subscriptions.sql` no Supabase

### "Webhook não funciona"
➡️ Use `stripe listen` localmente ou configure endpoint correto em produção

### "Redirecionamento infinito"
➡️ Limpe o cache do navegador e verifique as variáveis de ambiente

### "Pagamento não atualiza"
➡️ Verifique se o webhook está recebendo eventos no dashboard do Stripe

---

## 💰 Preços e Planos

**Atual**:
- Trial: 7 dias grátis
- Mensal: €20/mês

**Para mudar o preço**: 
1. Crie novo preço no Stripe
2. Atualize `NEXT_PUBLIC_STRIPE_PRICE_ID`
3. Atualize os textos nas páginas

---

## 🎉 Pronto para Usar!

Tudo está configurado e funcionando! Apenas:

1. ✅ Configure as variáveis de ambiente
2. ✅ Execute o SQL no Supabase
3. ✅ Teste localmente
4. ✅ Configure para produção quando estiver pronto

**Dúvidas?** Consulte o `STRIPE_SETUP.md` para detalhes completos!

---

**🚀 Boa sorte com seu SaaS!**

