# Setup do Sistema de Autenticação

Este documento contém as instruções para configurar o sistema de autenticação no Supabase.

## 1. Executar o Schema SQL

Acesse o Supabase Dashboard e execute os seguintes scripts SQL na ordem:

### 1.1. Schema Principal (se ainda não executado)
Execute o arquivo `database/schema.sql` primeiro para criar as tabelas base.

### 1.2. Schema de Autenticação
Execute o arquivo `database/auth-schema.sql` para criar:
- Tabela `users`
- Policies RLS (Row Level Security)
- Views úteis
- Usuário admin inicial

```sql
-- O script criará automaticamente um usuário admin:
-- Email: admin@quermesse.com
-- Senha: admin123
-- IMPORTANTE: Trocar a senha após primeiro login!
```

## 2. Configurar Supabase Auth

### 2.1. Habilitar Email Auth
1. Acesse: Authentication > Providers
2. Habilite "Email" provider
3. Desabilite "Confirm email" (para desenvolvimento)
4. Em produção, habilite confirmação de email

### 2.2. Configurar URL de Redirecionamento
1. Acesse: Authentication > URL Configuration
2. Adicione as URLs permitidas:
   - `http://localhost:5173` (desenvolvimento)
   - Sua URL de produção

### 2.3. Configurar Email Templates (Opcional)
1. Acesse: Authentication > Email Templates
2. Personalize os templates de:
   - Confirmação de email
   - Recuperação de senha
   - Convite de usuário

## 3. Criar Usuário Admin Manualmente (Alternativa)

Se preferir criar o admin manualmente via Supabase Dashboard:

1. Acesse: Authentication > Users
2. Clique em "Add user"
3. Preencha:
   - Email: admin@quermesse.com
   - Password: admin123
   - Auto Confirm User: ✓
4. Após criar, execute no SQL Editor:

```sql
-- Inserir registro na tabela users
INSERT INTO users (id, email, name, role, password_hash, active)
VALUES (
  'UUID_DO_USUARIO_CRIADO', -- Copie o UUID do usuário criado
  'admin@quermesse.com',
  'Administrador',
  'admin',
  'managed_by_auth',
  true
);
```

## 4. Testar Autenticação

### 4.1. Acessar a Aplicação
1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:5173`
3. Você será redirecionado para `/login`

### 4.2. Fazer Login
1. Use as credenciais:
   - Email: admin@quermesse.com
   - Senha: admin123
2. Após login bem-sucedido, você será redirecionado para `/dashboard`

### 4.3. Criar Outros Usuários
1. Como admin, acesse: Menu > Usuários
2. Clique em "Novo Usuário"
3. Preencha os dados:
   - Nome
   - Email
   - Senha
   - Perfil (Admin, Caixa ou Barraca)
   - Se Barraca, selecione a barraca

## 5. Perfis e Permissões

### ADMIN
**Pode acessar:**
- ✅ Todas as funcionalidades
- ✅ Criar/editar usuários
- ✅ Gerenciar barracas
- ✅ Gerenciar produtos e estoque
- ✅ Visualizar todos os relatórios
- ✅ Gerar lotes de cartões

### CAIXA
**Pode acessar:**
- ✅ Dashboard
- ✅ Escanear cartões
- ✅ Cadastrar clientes
- ✅ Fazer recargas
- ✅ Transferir saldo entre cartões
- ✅ Visualizar histórico de transações
- ❌ NÃO pode gerenciar barracas/produtos
- ❌ NÃO pode fazer vendas

### BARRACA (Operador)
**Pode acessar:**
- ✅ Fazer vendas (apenas na sua barraca)
- ✅ Visualizar histórico (apenas da sua barraca)
- ❌ NÃO pode fazer recargas
- ❌ NÃO pode acessar outras barracas
- ❌ NÃO pode gerenciar produtos

## 6. Segurança

### 6.1. Row Level Security (RLS)
O sistema usa RLS para garantir que:
- Usuários só vejam dados permitidos para seu perfil
- Barracas só acessem seus próprios dados
- Admin tenha acesso total

### 6.2. Boas Práticas
1. **Trocar senha padrão do admin imediatamente**
2. **Usar senhas fortes** (mínimo 8 caracteres)
3. **Habilitar confirmação de email em produção**
4. **Revisar logs de autenticação regularmente**
5. **Desativar usuários inativos**

## 7. Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Verifique se a senha está correta
- Verifique se o usuário existe no Supabase Auth
- Verifique se o usuário tem registro na tabela `users`

### Erro: "Usuário inativo"
- O usuário foi desativado por um admin
- Entre em contato com o administrador

### Erro: "Email not confirmed"
- Confirme o email através do link enviado
- Ou desabilite confirmação de email no Supabase

### Página em branco após login
- Verifique o console do navegador
- Verifique se as variáveis de ambiente estão corretas
- Verifique se o Supabase está configurado corretamente

### Redirecionamento incorreto
- Verifique se o perfil do usuário está correto
- Verifique se a barraca está vinculada (para perfil Barraca)

## 8. Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` está configurado:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 9. Fluxo de Autenticação

```
1. Usuário acessa a aplicação
   ↓
2. AuthContext verifica se há sessão ativa
   ↓
3. Se não autenticado → Redireciona para /login
   ↓
4. Usuário faz login
   ↓
5. Sistema valida credenciais no Supabase Auth
   ↓
6. Sistema busca perfil na tabela users
   ↓
7. Sistema verifica se usuário está ativo
   ↓
8. Redireciona para página apropriada:
   - Admin → /dashboard
   - Caixa → /caixa/novo-cliente
   - Barraca → /sale
```

## 10. Próximos Passos

Após configurar a autenticação:

1. ✅ Criar barracas no sistema
2. ✅ Criar produtos para as barracas
3. ✅ Criar usuários operadores de barraca
4. ✅ Gerar lote de cartões
5. ✅ Testar fluxo completo de vendas

## Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do navegador (F12 > Console)
2. Verifique os logs do Supabase Dashboard
3. Revise este documento
4. Entre em contato com o desenvolvedor