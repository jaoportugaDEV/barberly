# 🎯 Guia de Configuração do Stripe - Barberly

## 📋 Visão Geral

Este guia vai ajudá-lo a configurar completamente o sistema de pagamentos com Stripe no Barberly, incluindo:
- ✅ Trial gratuito de 7 dias
- ✅ Assinatura mensal de €20
- ✅ Webhooks para sincronização automática
- ✅ Bloqueio de acesso após trial/cancelamento

---

## 🚀 Passo 1: Configurar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta (ou faça login)
2. No painel do Stripe, ative o modo de teste (botão no canto superior direito)
3. Anote as chaves de API:
   - Vá em **Developers** → **API Keys**
   - Copie a **Publishable key** (começa com `pk_test_`)
   - Copie a **Secret key** (começa com `sk_test_`)

---

## 💶 Passo 2: Criar Produto e Preço

1. No painel do Stripe, vá em **Products** → **Add Product**
2. Preencha:
   - **Name**: `Barberly Premium`
   - **Description**: `Acesso completo à plataforma de gestão`
3. Em **Pricing**:
   - **Price**: `20.00`
   - **Currency**: `EUR`
   - **Billing period**: `Monthly`
4. Clique em **Save product**
5. **IMPORTANTE**: Copie o **Price ID** (começa com `price_xxx`)

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase (você já deve ter essas)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe - Adicione estas novas
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Vamos configurar no próximo passo

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Importante**: Nunca commite o arquivo `.env.local` no Git!

---

## 🗄️ Passo 4: Criar Tabela no Supabase

1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Execute o script em `supabase/subscriptions.sql`

Ou copie e execute este SQL:

```sql
-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🔔 Passo 5: Configurar Webhooks

Os webhooks permitem que o Stripe notifique seu app sobre mudanças nas assinaturas.

### 🌍 Para Produção (Deploy):

1. No Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. **Endpoint URL**: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Cole no `.env.local` como `STRIPE_WEBHOOK_SECRET`

### 💻 Para Desenvolvimento Local:

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Faça login: `stripe login`
3. Execute o forward:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copie o webhook secret que aparece e adicione ao `.env.local`

---

## ✅ Passo 6: Testar o Sistema

### Teste 1: Trial Gratuito

1. Acesse `http://localhost:3000`
2. Faça login ou crie uma conta
3. Você deve ser redirecionado para `/trial`
4. Clique em "Iniciar Trial Gratuito"
5. Complete o cadastro em `/signup`
6. Acesse o dashboard - deve aparecer um banner informando sobre o trial

### Teste 2: Assinatura

1. Na página `/assinatura`, clique em "Assinar Agora"
2. Use o cartão de teste do Stripe:
   - **Número**: `4242 4242 4242 4242`
   - **Data**: qualquer data futura
   - **CVC**: qualquer 3 dígitos
   - **ZIP**: qualquer código
3. Complete o pagamento
4. Você deve ser redirecionado de volta ao dashboard
5. O banner deve desaparecer

### Teste 3: Webhook

1. Com o Stripe CLI rodando, faça uma assinatura
2. No terminal, você verá os eventos sendo recebidos
3. Verifique no Supabase se a tabela `subscriptions` foi atualizada

---

## 🔄 Fluxo Completo do Usuário

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário acessa o site (não logado)                  │
│    → Redireciona para /login                            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Usuário faz login                                    │
│    → Verifica se tem subscription                       │
│    → Se não tem: redireciona para /trial                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Página /trial                                        │
│    → Usuário escolhe:                                   │
│      a) Trial gratuito de 7 dias                        │
│      b) Assinar diretamente (€20/mês)                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4a. Se escolheu Trial:                                  │
│     → Cria registro de subscription com status "trial"  │
│     → Redireciona para /signup                          │
│     → Completa cadastro do perfil                       │
│     → Acessa dashboard por 7 dias                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4b. Se escolheu Assinar:                                │
│     → Redireciona para checkout do Stripe               │
│     → Após pagamento: webhook atualiza subscription     │
│     → Status muda para "active"                         │
│     → Acesso liberado                                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Trial expira após 7 dias:                            │
│     → Middleware bloqueia acesso a /dono/*              │
│     → Redireciona para /assinatura                      │
│     → Usuário deve assinar para continuar               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Páginas Criadas

| Rota | Descrição |
|------|-----------|
| `/trial` | Página inicial para escolher trial ou assinatura |
| `/assinatura` | Página de checkout e gerenciamento de assinatura |
| `/signup` | Completar perfil (só acessível após trial/assinatura) |
| `/dono/[donoid]` | Dashboard principal (protegido por assinatura) |

---

## 🛡️ Sistema de Proteção

O middleware (`middleware.js`) protege automaticamente:

1. **Sem login**: bloqueia `/dono/*` e `/dashboard/*`
2. **Sem trial/assinatura**: bloqueia `/signup` e `/dono/*`
3. **Trial expirado**: redireciona para `/assinatura`
4. **Assinatura cancelada**: bloqueia acesso

---

## 🧪 Cartões de Teste do Stripe

| Cartão | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Pagamento bem-sucedido |
| `4000 0025 0000 3155` | ⚠️ Requer autenticação 3D Secure |
| `4000 0000 0000 9995` | ❌ Pagamento recusado |

Data de validade: qualquer data futura  
CVC: qualquer 3 dígitos  
ZIP: qualquer código postal

---

## 🚀 Deploy em Produção

### 1. Configurar Variáveis de Ambiente na Vercel/Netlify:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Chaves LIVE
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### 2. Ativar Modo Live no Stripe:

1. No Stripe, desative o modo de teste
2. Crie um novo produto e preço no modo LIVE
3. Copie as novas chaves API (começam com `pk_live_` e `sk_live_`)
4. Atualize as variáveis de ambiente

### 3. Configurar Webhook de Produção:

1. No Stripe (modo LIVE), vá em **Webhooks**
2. Adicione endpoint: `https://seu-dominio.com/api/stripe/webhook`
3. Copie o signing secret e atualize `STRIPE_WEBHOOK_SECRET`

---

## 📞 Troubleshooting

### Problema: Webhook não está funcionando

**Solução**:
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Teste com `stripe listen` localmente
- Veja os logs no painel do Stripe

### Problema: Redirecionamento infinito

**Solução**:
- Verifique se a tabela `subscriptions` existe no Supabase
- Confirme que o RLS está configurado corretamente
- Limpe o cache do navegador

### Problema: Pagamento não atualiza status

**Solução**:
- Verifique se o webhook está recebendo eventos
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está correto
- Veja os logs da API em `/api/stripe/webhook`

---

## 🎉 Pronto!

Seu sistema de pagamentos está configurado! Agora seus clientes podem:
- ✅ Testar grátis por 7 dias
- ✅ Assinar por €20/mês
- ✅ Gerenciar assinaturas pelo portal do Stripe
- ✅ Ter acesso bloqueado automaticamente quando não pagar

Se tiver dúvidas, consulte a [documentação do Stripe](https://stripe.com/docs) ou a [documentação do Supabase](https://supabase.com/docs).

