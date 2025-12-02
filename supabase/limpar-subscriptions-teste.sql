-- Script para limpar subscriptions antigas de modo LIVE
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver todas as subscriptions atuais
SELECT 
  id,
  user_id,
  stripe_customer_id,
  status,
  created_at
FROM subscriptions;

-- 2. Deletar TODAS as subscriptions existentes
-- (Isso é seguro porque estamos em desenvolvimento/teste)
DELETE FROM subscriptions;

-- 3. Verificar se deletou (deve retornar vazio)
SELECT * FROM subscriptions;

-- Pronto! Agora você pode testar novamente.
-- O sistema vai criar um novo customer de TESTE.

