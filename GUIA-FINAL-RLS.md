# Guia Final - Correção de RLS no Supabase

## IMPORTANTE - V3 (Correção de Recursão)

⚠️ **Esta versão corrige o erro "infinite recursion detected"** usando `auth.jwt()` para verificar roles diretamente do token JWT, sem consultar a tabela users.

**O que mudou na V3:**
- ✅ Usa `auth.jwt()` ao invés de subquery em `users`
- ✅ Elimina recursão infinita nas políticas de admin
- ✅ Mantém todas as funcionalidades de segurança
- ✅ Performance melhorada (sem loops)

---

## Problema
Erro ao criar usuários em produção: "new row violates row-level security policy for table 'users'"

## Causa
As políticas RLS (Row Level Security) da tabela `users` estão bloqueando até mesmo operações com service_role.

## Solução Definitiva

### PASSO 1: Acessar SQL Editor do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### PASSO 2: Executar Script de Correção

Copie e cole o conteúdo completo do arquivo `supabase/fix-rls-policies.sql` no editor SQL.

**OU** copie diretamente daqui:

```sql
-- ============================================
-- FIX: Políticas RLS para tabela users (V3)
-- ============================================
-- CORRIGE: Recursão infinita usando auth.jwt()
-- ============================================

-- PASSO 1: Remover TODAS as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    END LOOP;
END $$;

-- PASSO 2: Desabilitar e reabilitar RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar políticas SEM RECURSÃO

-- SELECT: Usuários veem seus próprios dados
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins veem todos (usando JWT, SEM recursão)
CREATE POLICY "users_select_admin"
ON users FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

-- INSERT: Service role pode inserir
CREATE POLICY "users_insert_service_role"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

-- INSERT: Admins podem inserir (usando JWT)
CREATE POLICY "users_insert_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

-- UPDATE: Service role pode atualizar
CREATE POLICY "users_update_service_role"
ON users FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- UPDATE: Usuários atualizam seus dados (exceto role)
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (
    SELECT role FROM users WHERE id = auth.uid()
  )
);

-- UPDATE: Admins atualizam qualquer usuário (usando JWT)
CREATE POLICY "users_update_admin"
ON users FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin')
);

-- DELETE: Service role pode deletar
CREATE POLICY "users_delete_service_role"
ON users FOR DELETE
TO service_role
USING (true);

-- DELETE: Apenas superadmins podem deletar (usando JWT)
CREATE POLICY "users_delete_superadmin"
ON users FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superadmin'
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT
  policyname as "Política",
  cmd as "Operação",
  roles as "Roles"
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
```

### PASSO 3: Executar o Script

1. Clique no botão **Run** (ou pressione Ctrl+Enter / Cmd+Enter)
2. Aguarde a execução completa
3. Verifique a saída na seção "Results"

### PASSO 4: Verificar Resultado

Você deve ver uma tabela com **9 políticas** criadas:

| Política | Operação | Roles |
|----------|----------|-------|
| users_delete_service_role | DELETE | service_role |
| users_delete_superadmin | DELETE | authenticated |
| users_insert_admin | INSERT | authenticated |
| users_insert_service_role | INSERT | service_role |
| users_select_admin | SELECT | authenticated |
| users_select_own | SELECT | authenticated |
| users_update_admin | UPDATE | authenticated |
| users_update_own | UPDATE | authenticated |
| users_update_service_role | UPDATE | service_role |

### PASSO 5: Testar em Produção

1. Acesse seu sistema em produção (Vercel)
2. Faça login como ADMIN
3. Tente criar um novo usuário
4. Verifique se:
   - ✅ Usuário é criado com sucesso
   - ✅ Email é confirmado automaticamente
   - ✅ barraca_id é salvo corretamente (se aplicável)
   - ✅ Usuário aparece na lista

## Troubleshooting

### Se ainda der erro de RLS

Execute este comando isolado primeiro:

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

Depois execute o script completo novamente.

### Se der erro "permission denied"

Verifique se você está logado como **Owner** do projeto no Supabase.

### Se o service_role não funcionar

1. Vá em **Settings** > **API** no Supabase
2. Copie a **service_role key** (não a anon key)
3. No Vercel, vá em **Settings** > **Environment Variables**
4. Verifique se `VITE_SUPABASE_SERVICE_ROLE_KEY` está configurada corretamente
5. Faça um novo deploy após alterar

## Validação Final

Execute esta query para confirmar que tudo está correto:

```sql
-- Verificar políticas
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';
```

Resultado esperado:
- 9 políticas listadas
- `rowsecurity` = `true`

## Próximos Passos

Após confirmar que a correção funcionou:

1. ✅ Criar alguns usuários de teste
2. ✅ Validar que barraca_id é salvo corretamente
3. ✅ Testar login com diferentes perfis
4. ✅ Validar permissões de cada perfil
5. ✅ Documentar o sistema para uso final

## Suporte

Se ainda houver problemas, verifique:
- Logs do Vercel (Runtime Logs)
- Logs do Supabase (Logs & Reports)
- Console do navegador (F12)

Documente o erro exato e compartilhe para análise.