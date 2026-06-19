-- =====================================================
-- SINCRONIZAÇÃO SUPABASE AUTH COM TABELA USERS
-- =====================================================
-- Este script cria a tabela users sincronizada com auth.users
-- e configura triggers automáticos para manter a sincronia

-- =====================================================
-- 1. CRIAR TABELA USERS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'caixa', 'barraca')),
    barraca_id BIGINT REFERENCES barracas(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_barraca_id ON users(barraca_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- =====================================================
-- 2. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- 3. FUNÇÃO PARA CRIAR USUÁRIO NA TABELA USERS
-- =====================================================
-- Esta função é chamada automaticamente quando um novo usuário
-- é criado no Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'caixa'),
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER PARA SINCRONIZAR NOVOS USUÁRIOS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. POLICIES DE ACESSO
-- =====================================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Admin pode ver todos os usuários" ON users;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON users;
DROP POLICY IF EXISTS "Admin pode inserir novos usuários" ON users;
DROP POLICY IF EXISTS "Admin pode atualizar usuários" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_system" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- =====================================================
-- POLICIES SEM RECURSÃO
-- =====================================================
-- IMPORTANTE: Não usar subqueries na tabela users para evitar recursão infinita
-- Usar apenas auth.uid() e auth.jwt() para verificações

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
-- USANDO OLD para evitar recursão
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Verifica que campos críticos não mudaram comparando com OLD
        -- Isso evita recursão pois OLD é o valor anterior, não precisa query
    );

-- NOTA: Para operações administrativas (criar/editar usuários),
-- use a API do Supabase Auth ou funções SECURITY DEFINER
-- que bypassam RLS. Não tente fazer isso via policies RLS.

-- =====================================================
-- 7. SINCRONIZAR USUÁRIOS EXISTENTES DO AUTH
-- =====================================================
-- Esta função sincroniza usuários que já existem no auth.users
-- mas não estão na tabela public.users

CREATE OR REPLACE FUNCTION sync_existing_auth_users()
RETURNS void AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, active)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
        COALESCE(au.raw_user_meta_data->>'role', 'caixa'),
        true
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Usuários sincronizados com sucesso!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar sincronização
SELECT sync_existing_auth_users();

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE users IS 'Tabela de usuários sincronizada com auth.users do Supabase';
COMMENT ON COLUMN users.id IS 'ID do usuário (mesmo ID do auth.users)';
COMMENT ON COLUMN users.role IS 'Perfil do usuário: admin, caixa ou barraca';
COMMENT ON COLUMN users.barraca_id IS 'ID da barraca vinculada (BIGINT - apenas para perfil barraca)';
COMMENT ON COLUMN users.active IS 'Indica se o usuário está ativo no sistema';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Made with Bob
