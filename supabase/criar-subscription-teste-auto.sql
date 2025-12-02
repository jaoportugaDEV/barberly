-- Script para criar subscription de TESTE automaticamente
-- TROQUE O EMAIL ABAIXO PELO SEU EMAIL REAL

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Busca o user_id pelo email (TROQUE AQUI)
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'joaovictor@gmail.com'; -- 👈 TROQUE SEU EMAIL AQUI
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com este email';
  END IF;
  
  -- Deleta subscription antiga se existir (para recriar)
  DELETE FROM subscriptions WHERE user_id = v_user_id;
  
  -- Cria subscription de teste ATIVA
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
    v_user_id,
    'cus_teste_' || substr(v_user_id::text, 1, 8), -- Customer ID fake
    'sub_teste_' || substr(v_user_id::text, 1, 8), -- Subscription ID fake
    'price_teste_123', -- Price ID fake
    'active', -- Status ATIVO
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '23 days',
    NOW(),
    NOW() + INTERVAL '30 days', -- Expira em 30 dias
    false -- NÃO está cancelada
  );
  
  RAISE NOTICE 'Subscription de teste criada com sucesso!';
END $$;

-- Verifica o resultado
SELECT 
  id,
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  cancel_at_period_end,
  TO_CHAR(current_period_end, 'DD/MM/YYYY HH24:MI') as expira_em,
  created_at
FROM subscriptions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'joaovictor@gmail.com')
ORDER BY created_at DESC
LIMIT 1;

