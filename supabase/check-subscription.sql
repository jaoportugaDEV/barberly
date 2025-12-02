-- Script para verificar assinaturas no banco
-- Execute este script no SQL Editor do Supabase

-- 1. Ver todas as subscriptions
SELECT 
  id,
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  cancel_at_period_end,
  current_period_end,
  created_at
FROM subscriptions
ORDER BY created_at DESC;

-- 2. Ver subscription do usuário logado (substitua o email)
SELECT 
  s.id,
  s.user_id,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.status,
  s.cancel_at_period_end,
  s.current_period_end,
  u.email
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'joaovictor@gmail.com'; -- Troque pelo seu email

-- 3. Contar quantas subscriptions existem
SELECT COUNT(*) as total_subscriptions FROM subscriptions;

-- 4. Ver status de todas as subscriptions
SELECT 
  status,
  COUNT(*) as quantidade
FROM subscriptions
GROUP BY status;

