# 🎯 Fluxo de Onboarding Completo - Saloniq

## 📋 Fluxo Atualizado

```
1️⃣ NOVO USUÁRIO
   └─> Acessa localhost:3000
       └─> Redireciona para /login
           └─> Clica em "Cadastre-se"
               └─> Vai para /cadastro

2️⃣ PÁGINA DE CADASTRO (/cadastro)
   └─> Preenche:
       • Email
       • Senha
       • Confirmar Senha
   └─> Clica em "Criar conta"
       └─> Cria conta no Supabase Auth
       └─> Cria perfil na tabela profiles
       └─> Redireciona para /trial

3️⃣ PÁGINA DE TRIAL (/trial)
   └─> Escolhe uma opção:
       
       A) TRIAL GRATUITO (7 dias)
          └─> Clica em "Trial Gratuito"
              └─> Cria registro na tabela subscriptions
                  • status: "trial"
                  • trial_start: hoje
                  • trial_end: hoje + 7 dias
              └─> Redireciona para /signup
       
       B) ASSINAR AGORA (€20/mês)
          └─> Clica em "Assinar Agora"
              └─> Redireciona para /assinatura
                  └─> Cria sessão de checkout Stripe
                  └─> Usuário paga
                  └─> Webhook atualiza subscription
                      • status: "active"
                  └─> Redireciona para /signup

4️⃣ PÁGINA DE SIGNUP (/signup)
   └─> Completa o perfil:
       • Nome da barbearia
       • Outros dados
   └─> Atualiza tabela profiles
       • role: "owner"
   └─> Redireciona para /dono/[donoid]

5️⃣ DASHBOARD (/dono/[donoid])
   └─> Acesso completo ao sistema! 🎉
```

---

## 🔑 Páginas Criadas/Atualizadas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Home (redireciona) | Público |
| `/login` | Login de usuários existentes | Público |
| **`/cadastro`** | **Nova conta (registro inicial)** | **Público** ✨ NOVO |
| `/trial` | Escolher trial ou assinatura | Autenticado (sem subscription) |
| `/assinatura` | Checkout e gerenciamento Stripe | Autenticado |
| `/signup` | Completar perfil (nome, etc) | Autenticado + Trial/Subscription |
| `/dono/[donoid]` | Dashboard principal | Autenticado + Assinado |

---

## ✅ O que foi corrigido?

### Antes (com erro):
❌ Usuário acessava localhost → login → clicava "Cadastre-se" → ia para `/signup` (erro!)
- `/signup` exige que já tenha trial/subscription
- Não tinha como criar conta nova

### Depois (corrigido):
✅ Usuário acessa localhost → login → clica "Cadastre-se" → vai para `/cadastro`
- Cria conta no Supabase
- Depois vai para `/trial` escolher plano
- Depois vai para `/signup` completar perfil
- Por fim, acessa o dashboard

---

## 🧪 Como Testar o Fluxo Completo

### Teste 1: Novo usuário com Trial Gratuito

1. Acesse: `http://localhost:3000`
2. Clique em "Cadastre-se"
3. Preencha email e senha
4. Clique em "Criar conta"
5. Na página de trial, escolha "Trial Gratuito"
6. Complete seu perfil (nome da barbearia)
7. ✅ Você tem 7 dias de acesso grátis!

### Teste 2: Novo usuário com Assinatura Paga

1. Acesse: `http://localhost:3000`
2. Clique em "Cadastre-se"
3. Preencha email e senha
4. Clique em "Criar conta"
5. Na página de trial, escolha "Assinar Agora"
6. Pague com cartão de teste: `4242 4242 4242 4242`
7. Complete seu perfil (nome da barbearia)
8. ✅ Você tem acesso imediato!

---

## 🔒 Proteções Implementadas

- **Middleware** verifica autenticação e subscriptions
- Usuário sem login → redireciona para `/login`
- Usuário sem trial/subscription → redireciona para `/trial`
- Trial expirado → redireciona para `/assinatura`
- Assinatura inativa → redireciona para `/assinatura`

---

## 📱 Rotas Públicas vs Protegidas

### Rotas Públicas (sem autenticação):
- `/login`
- `/cadastro` ✨ NOVA
- `/trial` (precisa estar logado)
- `/assinatura` (precisa estar logado)

### Rotas Protegidas (precisa autenticação + subscription):
- `/signup` (precisa trial ou subscription ativa)
- `/dono/[donoid]` (precisa trial ou subscription ativa)
- `/dashboard/:path*` (para barbeiros)

---

## 🎉 Pronto para Usar!

O fluxo de onboarding está completo e funcional. Agora seus usuários podem:

1. ✅ Criar conta facilmente
2. ✅ Escolher entre trial gratuito ou assinatura paga
3. ✅ Completar o perfil
4. ✅ Acessar o dashboard

---

**Data de Atualização:** 02/12/2024
**Versão:** 1.1.0

