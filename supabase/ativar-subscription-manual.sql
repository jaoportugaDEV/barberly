-- Script para ativar manualmente a subscription após pagamento de teste
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver o status atual
SELECT 
  id,
  user_id,
  stripe_customer_id,
  status,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- 2. Atualizar o status para "active" da subscription mais recente
-- (simula o que o webhook faria)
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month'
WHERE id = (
  SELECT id 
  FROM subscriptions 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. Verificar se atualizou
SELECT 
  id,
  user_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 1;

-- Pronto! Agora faça login novamente e deve funcionar!

