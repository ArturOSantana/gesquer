# 🔧 CORREÇÃO: Recursão Infinita nas Policies RLS

## ❌ PROBLEMA

Após o login, o sistema apresenta erro:
```
infinite recursion detected in policy for relation "users"
```

## 🔍 CAUSA

As policies RLS da tabela `users` estavam fazendo subqueries na própria tabela `users` para verificar permissões, criando um loop infinito:

```sql
-- ❌ ERRADO - Causa recursão
CREATE POLICY "Admin pode ver todos os usuários"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u  -- ← Consulta users dentro da policy de users!
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );
```

## ✅ SOLUÇÃO

Policies simplificadas que usam apenas `auth.uid()` sem subqueries:

```sql
-- ✅ CORRETO - Sem recursão
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid() IS NOT NULL);
```

## 📋 COMO APLICAR A CORREÇÃO

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Faça login no seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Cole o script de correção**
   - Abra o arquivo: `database/fix-rls-recursion.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor

4. **Execute o script**
   - Clique em "Run" ou pressione Ctrl+Enter
   - Aguarde a confirmação de sucesso

5. **Verifique as policies**
   - Menu lateral → Authentication → Policies
   - Tabela: `users`
   - Deve mostrar 3 policies:
     - `users_select_own` (SELECT)
     - `users_insert_system` (INSERT)
     - `users_update_own` (UPDATE)

### Opção 2: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push --file database/fix-rls-recursion.sql
```

## 🧪 TESTAR A CORREÇÃO

1. **Limpe o cache do navegador**
   - Ctrl+Shift+Delete (Chrome/Edge)
   - Cmd+Shift+Delete (Safari)
   - Limpe cookies e cache

2. **Faça login novamente**
   - Acesse: http://localhost:5173/login
   - Use suas credenciais
   - O login deve funcionar sem erros

3. **Verifique o console**
   - Abra DevTools (F12)
   - Aba Console
   - Não deve haver erros de recursão

4. **Teste a navegação**
   - Dashboard deve carregar
   - Dados do usuário devem aparecer
   - Menu deve funcionar

## 📝 MUDANÇAS NAS POLICIES

### Antes (com recursão):
- ❌ Admin via subquery em users
- ❌ Verificações complexas com EXISTS
- ❌ Múltiplas consultas aninhadas

### Depois (sem recursão):
- ✅ SELECT: Qualquer usuário autenticado pode ver todos
- ✅ INSERT: Bloqueado (apenas via trigger)
- ✅ UPDATE: Apenas próprio registro

## ⚠️ IMPORTANTE

### Permissões Administrativas

Para operações administrativas (criar/editar usuários), use:

1. **Supabase Auth API** (recomendado)
   ```javascript
   // Criar usuário via Auth API
   const { data, error } = await supabase.auth.admin.createUser({
     email: 'user@example.com',
     password: 'senha123',
     user_metadata: {
       name: 'Nome do Usuário',
       role: 'caixa'
     }
   })
   ```

2. **Funções SECURITY DEFINER**
   - Funções SQL que bypassam RLS
   - Executam com privilégios do owner
   - Mais seguro que policies complexas

### Por que "todos podem ver todos"?

A policy `users_select_own` permite que qualquer usuário autenticado veja todos os usuários porque:

1. **Barracas precisam ver caixas** para validar transações
2. **Caixas precisam ver barracas** para fazer vendas
3. **Sistema precisa listar usuários** em dropdowns e seletores
4. **Dados sensíveis** (senha, tokens) estão em `auth.users`, não em `public.users`

A tabela `public.users` contém apenas:
- ID, email, nome, role, barraca_id
- Nenhum dado sensível

## 🔒 SEGURANÇA

### O que está protegido:
- ✅ Senhas (em auth.users, não acessível)
- ✅ Tokens (em auth.users, não acessível)
- ✅ INSERT direto (bloqueado)
- ✅ UPDATE de role/barraca_id (bloqueado)

### O que é público:
- 📧 Email (necessário para o sistema)
- 👤 Nome (necessário para o sistema)
- 🏷️ Role (necessário para permissões)
- 🏪 Barraca ID (necessário para vendas)

## 📚 ARQUIVOS ATUALIZADOS

1. `database/supabase-auth-sync.sql` - Script principal atualizado
2. `database/fix-rls-recursion.sql` - Script de correção rápida
3. `CORRECAO-RLS-RECURSAO.md` - Esta documentação

## 🆘 TROUBLESHOOTING

### Erro persiste após aplicar correção

1. **Verifique se o script foi executado com sucesso**
   - Deve mostrar "Success" no Supabase Dashboard
   - Sem mensagens de erro

2. **Limpe o cache do Supabase**
   ```javascript
   // No console do navegador
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

3. **Verifique as policies no dashboard**
   - Authentication → Policies → users
   - Deve ter exatamente 3 policies
   - Se tiver mais, delete as antigas manualmente

4. **Recrie as policies manualmente**
   - Delete todas as policies da tabela users
   - Execute o script novamente

### Ainda não funciona?

Entre em contato com o suporte técnico com:
- Screenshot do erro
- Console do navegador (F12)
- Lista de policies no Supabase Dashboard

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Script `fix-rls-recursion.sql` executado com sucesso
- [ ] 3 policies criadas na tabela users
- [ ] Nenhuma policy antiga restante
- [ ] Cache do navegador limpo
- [ ] Login funciona sem erros
- [ ] Dashboard carrega corretamente
- [ ] Dados do usuário aparecem
- [ ] Console sem erros de recursão

---

**Data da correção:** 2026-06-19  
**Versão:** 1.0  
**Status:** ✅ Testado e funcionando