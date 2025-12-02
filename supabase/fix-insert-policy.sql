-- Script para adicionar política de INSERT que estava faltando
-- Execute este SQL no SQL Editor do Supabase

-- Remove a política se já existir (para evitar erro)
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;

-- Cria política de INSERT
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verifica se foi criada corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY policyname;

