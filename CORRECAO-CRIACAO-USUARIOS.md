# ✅ CORREÇÃO: Criação de Usuários - Erro password_hash

## 🔴 PROBLEMA IDENTIFICADO

Ao tentar criar um novo usuário, o sistema retornava o erro:
```
Could not find the 'password_hash' column of 'users' in the schema cache
```

### Causa Raiz
O código estava tentando inserir a coluna `password_hash` na tabela `users`, mas essa coluna **não existe e não deveria existir**, pois:
- A autenticação é gerenciada pelo **Supabase Auth** (`auth.users`)
- A tabela `users` apenas armazena dados adicionais (role, barraca_id, etc)
- As senhas são armazenadas de forma segura pelo Supabase Auth

## ✅ SOLUÇÃO IMPLEMENTADA

### Arquivo Corrigido
- **`src/pages/admin/Users.jsx`** (linhas 175-204)

### Mudanças Realizadas

#### ❌ ANTES (Código Incorreto)
```javascript
// Criar no Supabase Auth
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
});

// Inserir manualmente na tabela users (ERRADO!)
const { error: dbError } = await supabase
  .from('users')
  .insert({
    id: authData.user.id,
    email: formData.email,
    name: formData.name,
    role: formData.role,
    barraca_id: formData.role === ROLES.BARRACA ? formData.barraca_id : null,
    password_hash: 'managed_by_auth', // ❌ COLUNA NÃO EXISTE
    active: true,
  });
```

#### ✅ DEPOIS (Código Correto)
```javascript
// Criar no Supabase Auth com metadata
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      name: formData.name,
      role: formData.role,
      barraca_id: formData.role === ROLES.BARRACA ? formData.barraca_id : null,
    }
  }
});

// O trigger handle_new_user() cria automaticamente o registro na tabela users
await new Promise(resolve => setTimeout(resolve, 500));

// Atualizar campos adicionais se necessário (barraca_id)
if (formData.role === ROLES.BARRACA && formData.barraca_id) {
  const { error: updateError } = await supabase
    .from('users')
    .update({ barraca_id: formData.barraca_id })
    .eq('id', authData.user.id);
}
```

## 🔄 FLUXO CORRETO DE CRIAÇÃO

1. **Criar usuário no Supabase Auth** (`supabase.auth.signUp()`)
   - Passa email e senha
   - Inclui metadata (name, role, barraca_id) no campo `options.data`

2. **Trigger automático** (`handle_new_user()`)
   - Detecta novo usuário em `auth.users`
   - Cria automaticamente registro em `public.users`
   - Usa metadata para preencher campos adicionais

3. **Atualização adicional** (se necessário)
   - Atualiza campos específicos como `barraca_id`
   - Apenas se o trigger não conseguir processar tudo

## 📋 ARQUITETURA DO SISTEMA

### Tabela `auth.users` (Supabase Auth)
- Gerenciada pelo Supabase
- Armazena credenciais de forma segura
- Contém: id, email, encrypted_password, raw_user_meta_data

### Tabela `public.users` (Nossa aplicação)
- Sincronizada via trigger
- Armazena dados adicionais
- Contém: id, email, name, role, barraca_id, active

### Trigger `handle_new_user()`
- Arquivo: `database/supabase-auth-sync.sql`
- Executa automaticamente quando usuário é criado em `auth.users`
- Cria registro correspondente em `public.users`

## 🎯 BENEFÍCIOS DA CORREÇÃO

✅ **Segurança**: Senhas gerenciadas pelo Supabase Auth (criptografadas)  
✅ **Simplicidade**: Não precisamos gerenciar hashes de senha manualmente  
✅ **Sincronização**: Trigger automático mantém tabelas sincronizadas  
✅ **Manutenibilidade**: Código mais limpo e fácil de entender  
✅ **Conformidade**: Segue as melhores práticas do Supabase  

## 🧪 TESTE

Para testar a correção:

1. Acesse a página de **Gestão de Usuários** (Admin)
2. Clique em **"Novo Usuário"**
3. Preencha os dados:
   - Nome: Teste Silva
   - Email: teste@exemplo.com
   - Senha: teste123
   - Perfil: Caixa
4. Clique em **"Salvar"**
5. ✅ Usuário deve ser criado com sucesso

## 📝 NOTAS IMPORTANTES

- **Não armazene senhas** na tabela `users` - use sempre Supabase Auth
- **Metadata** no `signUp()` é copiado para `raw_user_meta_data` em `auth.users`
- **Trigger** `handle_new_user()` processa metadata automaticamente
- **Aguarde 500ms** após `signUp()` para garantir que trigger executou
- **RLS Policies** impedem inserção direta na tabela `users` (apenas via trigger)

## 🔗 ARQUIVOS RELACIONADOS

- ✅ `src/pages/admin/Users.jsx` - Corrigido
- ✅ `database/supabase-auth-sync.sql` - Trigger funcionando
- ✅ `database/schema.sql` - Schema correto (sem password_hash)

---

**Status**: ✅ CORRIGIDO  
**Data**: 2026-06-19  
**Prioridade**: CRÍTICA  
**Impacto**: Admin pode criar usuários normalmente