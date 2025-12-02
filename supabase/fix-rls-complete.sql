-- Script completo para corrigir todas as políticas RLS da tabela subscriptions
-- Execute este SQL no SQL Editor do Supabase

-- 1. Remove todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- 2. Desabilita RLS temporariamente para teste
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. Reabilita RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Cria políticas completas

-- Política de SELECT: Usuários podem ver suas próprias subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política de INSERT: Usuários podem criar suas próprias subscriptions
CREATE POLICY "Users can insert own subscription"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: Usuários podem atualizar suas próprias subscriptions
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política de DELETE: Usuários podem deletar suas próprias subscriptions (opcional)
CREATE POLICY "Users can delete own subscription"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Verifica as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- 6. Testa se você consegue fazer SELECT
SELECT * FROM subscriptions WHERE user_id = auth.uid();

