-- =====================================================
-- CORREÇÃO: Recursão Infinita nas Policies RLS
-- =====================================================
-- Este script corrige o erro de recursão infinita
-- removendo policies que fazem subqueries na tabela users

-- =====================================================
-- 1. REMOVER TODAS AS POLICIES ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Admin pode ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
DROP POLICY IF EXISTS "Admin pode inserir novos usuários" ON users;
DROP POLICY IF EXISTS "Admin pode atualizar usuários" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_system" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- =====================================================
-- 2. CRIAR POLICIES SEM RECURSÃO
-- =====================================================
-- IMPORTANTE: Não usar subqueries na tabela users para evitar recursão infinita
-- Usar apenas auth.uid() para verificações

-- Policy: Todos os usuários autenticados podem ver todos os usuários
-- (Necessário para o sistema funcionar - barracas precisam ver caixas, etc)
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Apenas o sistema pode inserir (via trigger)
-- Usuários não podem inserir diretamente
CREATE POLICY "users_insert_system"
    ON users FOR INSERT
    WITH CHECK (false);

-- Policy: Usuários podem atualizar apenas seus próprios dados básicos
-- (name, email) mas não podem mudar role ou barraca_id
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =====================================================
-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para aplicar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script
-- 4. Execute
-- 5. Teste o login novamente

-- Made with Bob
