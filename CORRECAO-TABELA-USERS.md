# 🔧 Correção: Tabela Users e Sincronização com Supabase Auth

## 📋 Problema Identificado

**Erro:** "Could not find the table 'public.users' in the schema cache"

### Causa
O sistema usa **Supabase Auth** para autenticação, mas a tabela `public.users` não estava criada ou sincronizada com os usuários do `auth.users`.

### Fluxo Correto
1. Usuário faz login → Supabase Auth valida credenciais
2. Sistema busca dados adicionais na tabela `public.users`
3. Se a tabela não existe → ERRO ❌

---

## ✅ Solução Implementada

### 1. Credenciais de Teste Removidas
- ✅ Removido texto de credenciais padrão do `Login.jsx`
- Arquivo: `src/pages/Login.jsx`

### 2. SQL de Sincronização Criado
- ✅ Novo arquivo: `database/supabase-auth-sync.sql`
- Cria tabela `users` sincronizada com `auth.users`
- Configura triggers automáticos
- Sincroniza usuários existentes

---

## 🚀 Como Executar no Supabase

### Passo 1: Acessar o SQL Editor

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**

### Passo 2: Executar o Script Principal

1. Abra o arquivo `database/supabase-auth-sync.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl/Cmd + Enter`)

### Passo 3: Verificar Execução

Você deve ver mensagens como:
```
✓ CREATE TABLE
✓ CREATE INDEX
✓ CREATE FUNCTION
✓ CREATE TRIGGER
✓ CREATE POLICY
✓ NOTICE: Usuários sincronizados com sucesso!
```

### Passo 4: Verificar Tabela Criada

Execute este SQL para verificar:
```sql
-- Ver estrutura da tabela
SELECT * FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- Ver usuários sincronizados
SELECT id, email, name, role, active, created_at 
FROM public.users;
```

---

## 🔐 Como Criar Usuário Admin

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha:
   - **Email:** admin@quermesse.com
   - **Password:** (escolha uma senha segura)
   - **Auto Confirm User:** ✅ Marque esta opção
4. Clique em **Create User**

5. Agora execute este SQL para definir como admin:
```sql
-- Atualizar usuário para admin
UPDATE public.users 
SET role = 'admin', 
    name = 'Administrador'
WHERE email = 'admin@quermesse.com';
```

### Opção 2: Via SQL Completo

```sql
-- 1. Criar usuário no Auth (substitua a senha)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@quermesse.com',
    crypt('SUA_SENHA_AQUI', gen_salt('bf')),
    NOW(),
    '{"name": "Administrador", "role": "admin"}'::jsonb,
    NOW(),
    NOW()
);

-- 2. O trigger criará automaticamente na tabela users
-- Mas você pode forçar a sincronização:
SELECT sync_existing_auth_users();
```

---

## 🧪 Testar o Sistema

### 1. Fazer Login
1. Acesse a aplicação
2. Faça login com o usuário admin criado
3. Você deve ser redirecionado para `/dashboard`

### 2. Verificar Perfil
Abra o console do navegador (F12) e execute:
```javascript
// Ver dados do usuário logado
console.log(localStorage.getItem('supabase.auth.token'));
```

### 3. Verificar no Banco
```sql
-- Ver sessões ativas
SELECT * FROM auth.sessions 
WHERE user_id IN (SELECT id FROM public.users);

-- Ver último login
SELECT 
    u.email,
    u.name,
    u.role,
    au.last_sign_in_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY au.last_sign_in_at DESC;
```

---

## 📊 Estrutura da Tabela Users

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY,              -- Mesmo ID do auth.users
    email TEXT UNIQUE NOT NULL,       -- Email do usuário
    name TEXT NOT NULL,               -- Nome completo
    role TEXT NOT NULL,               -- admin | caixa | barraca
    barraca_id UUID,                  -- ID da barraca (se role = barraca)
    active BOOLEAN DEFAULT true,      -- Usuário ativo?
    created_at TIMESTAMPTZ,           -- Data de criação
    updated_at TIMESTAMPTZ            -- Última atualização
);
```

---

## 🔄 Sincronização Automática

### Como Funciona

1. **Novo usuário criado no Supabase Auth**
   - Trigger `on_auth_user_created` é acionado
   - Função `handle_new_user()` cria registro em `public.users`
   - Role padrão: `caixa`

2. **Usuário atualiza perfil**
   - Trigger `trigger_update_users_updated_at` atualiza `updated_at`

3. **Usuário é deletado do Auth**
   - Cascade delete remove de `public.users` automaticamente

### Sincronizar Usuários Existentes

Se você já tinha usuários no Auth antes de executar o script:
```sql
-- Sincronizar todos os usuários do auth.users
SELECT sync_existing_auth_users();
```

---

## 🛡️ Segurança (RLS Policies)

### Policies Configuradas

1. **Admin pode ver todos os usuários**
2. **Usuários podem ver seus próprios dados**
3. **Admin pode inserir novos usuários**
4. **Admin pode atualizar usuários**
5. **Usuários podem atualizar seus próprios dados** (exceto role e barraca_id)

### Testar Policies

```sql
-- Como admin, deve retornar todos os usuários
SELECT * FROM public.users;

-- Como usuário comum, deve retornar apenas seus dados
SELECT * FROM public.users WHERE id = auth.uid();
```

---

## 🐛 Troubleshooting

### Erro: "relation 'barracas' does not exist"

Execute primeiro o schema principal:
```bash
# No SQL Editor do Supabase
-- Executar database/schema.sql primeiro
-- Depois executar database/supabase-auth-sync.sql
```

### Erro: "permission denied for table users"

Verifique se RLS está configurado:
```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Deve retornar: rowsecurity = true
```

### Usuário não aparece na tabela users

```sql
-- Forçar sincronização
SELECT sync_existing_auth_users();

-- Verificar se usuário existe no auth
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'seu@email.com';
```

### Login funciona mas dá erro ao carregar perfil

```sql
-- Verificar se usuário está ativo
SELECT id, email, active 
FROM public.users 
WHERE email = 'seu@email.com';

-- Ativar usuário se necessário
UPDATE public.users 
SET active = true 
WHERE email = 'seu@email.com';
```

---

## 📝 Próximos Passos

1. ✅ Execute o SQL no Supabase
2. ✅ Crie o usuário admin
3. ✅ Teste o login
4. ✅ Verifique o dashboard
5. 🔄 Crie outros usuários conforme necessário

---

## 🔗 Arquivos Relacionados

- `database/supabase-auth-sync.sql` - Script de sincronização
- `database/schema.sql` - Schema principal do banco
- `src/contexts/AuthContext.jsx` - Contexto de autenticação
- `src/pages/Login.jsx` - Página de login (credenciais removidas)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase (Dashboard → Logs)
2. Verifique o console do navegador (F12)
3. Execute os comandos de troubleshooting acima

---

**Última atualização:** 2026-06-19  
**Versão:** 1.0.0