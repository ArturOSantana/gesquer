-- =====================================================
-- CRIAR PERFIL SUPERADMIN
-- =====================================================
-- Este script cria o perfil SUPERADMIN com permissões especiais
-- e o primeiro usuário superadmin do sistema

-- =====================================================
-- 1. ATUALIZAR CONSTRAINT DA TABELA USERS
-- =====================================================
-- Adicionar 'superadmin' aos roles permitidos

ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('superadmin', 'admin', 'caixa', 'barraca'));

-- =====================================================
-- 2. CRIAR USUÁRIO SUPERADMIN NO SUPABASE AUTH
-- =====================================================
-- IMPORTANTE: Este script deve ser executado no SQL Editor do Supabase
-- pois precisa de acesso à tabela auth.users

-- Verificar se o usuário já existe
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Tentar encontrar usuário existente
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'admin@quermesse.com';
    
    -- Se não existir, criar novo usuário
    IF v_user_id IS NULL THEN
        -- Inserir no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@quermesse.com',
            crypt('admg123?', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Super Admin","role":"superadmin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuário SUPERADMIN criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuário admin@quermesse.com já existe com ID: %', v_user_id;
    END IF;
    
    -- Atualizar ou inserir na tabela public.users
    INSERT INTO public.users (id, email, name, role, active)
    VALUES (
        v_user_id,
        'admin@quermesse.com',
        'Super Admin',
        'superadmin',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'superadmin',
        name = 'Super Admin',
        active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Perfil SUPERADMIN configurado com sucesso!';
    RAISE NOTICE 'Email: admin@quermesse.com';
    RAISE NOTICE 'Senha: admg123?';
END $$;

-- =====================================================
-- 3. VERIFICAR CRIAÇÃO
-- =====================================================

SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.active,
    u.created_at
FROM public.users u
WHERE u.email = 'admin@quermesse.com';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Made with Bob