# EMERGÊNCIA - Correção Imediata de RLS (V3)

## PROBLEMA ATUAL
Sistema em produção com erro: **"infinite recursion detected in policy for relation 'users'"**

Ninguém consegue fazer login!

## SOLUÇÃO IMEDIATA

### PASSO 1: Acessar Supabase AGORA

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### PASSO 2: COPIAR E COLAR ESTE SCRIPT

```sql
-- ============================================
-- EMERGÊNCIA: FIX RLS V3 (SEM RECURSÃO)
-- ============================================

-- Remover TODAS as políticas problemáticas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    END LOOP;
END $$;

-- Resetar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas CORRETAS (usando JWT, sem recursão)

CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_select_admin"
ON users FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

CREATE POLICY "users_insert_service_role"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "users_insert_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

CREATE POLICY "users_update_service_role"
ON users FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

CREATE POLICY "users_update_admin"
ON users FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

CREATE POLICY "users_delete_service_role"
ON users FOR DELETE
TO service_role
USING (true);

CREATE POLICY "users_delete_superadmin"
ON users FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
);

-- Verificar resultado
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;
```

### PASSO 3: EXECUTAR

1. Clique em **RUN** (ou Ctrl+Enter / Cmd+Enter)
2. Aguarde 5-10 segundos
3. Verifique a tabela de resultado

### PASSO 4: VERIFICAR

Você DEVE ver **9 políticas** listadas:

- users_delete_service_role
- users_delete_superadmin
- users_insert_admin
- users_insert_service_role
- users_select_admin
- users_select_own
- users_update_admin
- users_update_own
- users_update_service_role

### PASSO 5: TESTAR LOGIN

1. Abra seu sistema em produção
2. Tente fazer login
3. Deve funcionar SEM erro de recursão

## O QUE MUDOU NA V3?

**❌ ANTES (V2 - causava recursão):**
```sql
-- Política verificava role consultando a tabela users
USING (
  EXISTS (
    SELECT 1 FROM users  -- ← Loop infinito!
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'superadmin')
  )
)
```

**✅ AGORA (V3 - sem recursão):**
```sql
-- Política lê role direto do JWT
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
  -- ↑ Sem consultar users, sem recursão!
)
```

## SE AINDA DER ERRO

### Erro: "permission denied"
- Verifique se você está logado como **Owner** do projeto

### Erro: "policy already exists"
- Execute primeiro só a parte de DROP:
```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    END LOOP;
END $$;
```
- Depois execute o script completo novamente

### Login ainda não funciona
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout completo
3. Tente login novamente
4. Verifique os logs do navegador (F12 → Console)

## PRÓXIMOS PASSOS

Após confirmar que o login funciona:

1. ✅ Criar alguns usuários de teste
2. ✅ Validar permissões de cada perfil
3. ✅ Testar todas as funcionalidades críticas
4. ✅ Documentar a correção

## SUPORTE

Se precisar de ajuda:
- Logs do Supabase: Dashboard → Logs & Reports
- Logs do Vercel: Dashboard → Runtime Logs
- Console do navegador: F12 → Console

Documente qualquer erro e compartilhe para análise.