-- Script para criar uma subscription de TESTE para testar cancelamento
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Troque 'joaovictor@gmail.com' pelo seu email real

-- 1. Primeiro, vamos ver seu user_id
SELECT id, email FROM auth.users WHERE email = 'joaovictor@gmail.com';

-- 2. Depois de ver o user_id acima, crie a subscription de teste
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID que apareceu acima
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  trial_start,
  trial_end,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'SEU_USER_ID_AQUI', -- TROQUE AQUI pelo seu user_id
  'cus_test_123456789', -- Customer ID fake para teste
  'sub_test_123456789', -- Subscription ID fake para teste
  'price_test_123456789', -- Price ID fake
  'active', -- Status ativo
  NOW() - INTERVAL '7 days', -- Trial começou 7 dias atrás
  NOW() + INTERVAL '23 days', -- Trial termina em 23 dias (30 dias total)
  NOW(), -- Período atual começou agora
  NOW() + INTERVAL '30 days', -- Período atual termina em 30 dias
  false -- Não está cancelado
);

-- 3. Verificar se foi criado
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
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'joaovictor@gmail.com');

