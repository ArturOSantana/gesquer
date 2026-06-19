# Configuração da Service Role Key no Vercel

## 🎯 Problema
Erro ao criar usuários em produção: "new row violates row-level security policy for table 'users'"

## 🔍 Causa
A variável de ambiente `VITE_SUPABASE_SERVICE_ROLE_KEY` não está configurada no Vercel.

## ✅ Solução - Passo a Passo

### PASSO 1: Obter a Service Role Key do Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"Settings"** (Configurações)
4. Clique em **"API"**
5. Role até a seção **"Project API keys"**
6. Localize a chave **"service_role"** (NÃO é a "anon public")
7. Clique no ícone de **"olho"** 👁️ para revelar a chave
8. Clique no ícone de **"copiar"** 📋 para copiar a chave

**⚠️ IMPORTANTE:** A service_role key é **SECRETA** e dá acesso total ao banco de dados. **NUNCA** compartilhe ou commite no Git.

### PASSO 2: Adicionar a Variável no Vercel

1. Acesse o dashboard do Vercel: https://vercel.com/dashboard
2. Selecione seu projeto (**quermesseon**)
3. Clique na aba **"Settings"** (Configurações)
4. No menu lateral, clique em **"Environment Variables"**
5. Clique no botão **"Add New"**
6. Preencha os campos:
   - **Name:** `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Cole a chave copiada do Supabase
   - **Environment:** Selecione **todas** as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. Clique em **"Save"**

### PASSO 3: Fazer Redeploy

Após adicionar a variável, você precisa fazer um novo deploy para que as mudanças tenham efeito:

#### Opção 1 - Pelo Dashboard do Vercel (Recomendado):
1. Vá para a aba **"Deployments"**
2. Clique nos **três pontos** (...) do último deployment
3. Clique em **"Redeploy"**
4. Confirme clicando em **"Redeploy"** novamente

#### Opção 2 - Fazer novo commit:
```bash
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push
```

### PASSO 4: Validar

1. Aguarde o deploy finalizar (1-2 minutos)
2. Acesse seu site em produção
3. Faça login como **admin**
4. Tente criar um novo usuário
5. ✅ Verifique que não há mais erro de RLS

## 🔒 Verificação de Segurança

Certifique-se de que:

- ✅ A service_role key está no `.gitignore`
- ✅ A service_role key está apenas no Vercel (variáveis de ambiente)
- ✅ A service_role key **NÃO** está no código fonte
- ✅ A service_role key é usada apenas no backend (server-side)
- ✅ O arquivo `.env` local **NÃO** foi commitado

## 🔧 Troubleshooting

### ❌ Erro persiste após adicionar a variável

Verifique os seguintes pontos:

1. **Nome da variável:** Confirme que está EXATAMENTE como: `VITE_SUPABASE_SERVICE_ROLE_KEY`
2. **Valor completo:** Verifique se copiou a chave COMPLETA (sem espaços no início/fim)
3. **Environment:** Certifique-se de que selecionou "Production" ao adicionar a variável
4. **Redeploy:** Confirme que fez o redeploy APÓS adicionar a variável
5. **Cache:** Limpe o cache do navegador (Ctrl+Shift+Delete ou Cmd+Shift+Delete)

### 🔍 Como verificar se a variável está configurada

No console do navegador (F12), você pode verificar se a variável existe:

```javascript
console.log('Service Role Key configurada:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
```

- Se retornar `true`: ✅ Variável configurada
- Se retornar `false`: ❌ Variável não está configurada corretamente

### 📋 Checklist de Verificação

Antes de pedir ajuda, confirme que:

- [ ] A service_role key foi copiada corretamente do Supabase
- [ ] O nome da variável está correto no Vercel
- [ ] A variável foi adicionada para o ambiente "Production"
- [ ] Foi feito redeploy após adicionar a variável
- [ ] O deploy foi concluído com sucesso (sem erros)
- [ ] O cache do navegador foi limpo
- [ ] Você está testando na URL de produção (não localhost)

### 🐛 Erros Comuns

#### Erro: "Invalid API key"
**Causa:** Service role key incorreta ou incompleta  
**Solução:** Copie novamente a chave do Supabase e substitua no Vercel

#### Erro: "Environment variable not found"
**Causa:** Nome da variável incorreto  
**Solução:** Verifique que o nome é exatamente `VITE_SUPABASE_SERVICE_ROLE_KEY`

#### Erro: "RLS policy violation" ainda aparece
**Causa:** Redeploy não foi feito ou não foi concluído  
**Solução:** Faça um novo redeploy e aguarde a conclusão

## 📊 Próximos Passos

Após configurar a service_role key com sucesso:

1. ✅ Criação de usuários funcionará em produção
2. ✅ Email será confirmado automaticamente
3. ✅ Não haverá mais erro de RLS
4. ✅ Sistema estará pronto para uso em produção
5. ✅ Administradores poderão gerenciar usuários normalmente

## 🆘 Suporte

Se o erro persistir após seguir **todos** os passos acima:

1. **Logs do Vercel:** Verifique os logs na aba "Logs" do deployment
2. **Console do navegador:** Abra o console (F12) e procure por erros
3. **Service role key:** Confirme que a chave está correta no dashboard do Supabase
4. **Políticas RLS:** Verifique se as políticas RLS estão corretas no Supabase

### Onde encontrar os logs:

**Vercel:**
- Dashboard → Seu Projeto → Deployments → Clique no deployment → Aba "Logs"

**Navegador:**
- Pressione F12 → Aba "Console"

**Supabase:**
- Dashboard → Seu Projeto → Logs → Query Logs

## 📚 Documentos Relacionados

- [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) - Guia completo de deploy no Vercel
- [CONFIGURACAO-SUPABASE.md](./CONFIGURACAO-SUPABASE.md) - Configuração do Supabase
- [CORRECAO-CRIACAO-USUARIOS.md](./CORRECAO-CRIACAO-USUARIOS.md) - Correção de criação de usuários
- [README.md](./README.md) - Documentação principal do projeto

## 📝 Notas Importantes

### Diferença entre as chaves do Supabase:

| Chave | Uso | Segurança | Onde usar |
|-------|-----|-----------|-----------|
| **anon public** | Cliente (frontend) | Pública | Pode ser exposta no código |
| **service_role** | Servidor (backend) | **SECRETA** | Apenas variáveis de ambiente |

### Por que usar service_role key?

A service_role key é necessária para:
- Criar usuários sem autenticação prévia
- Confirmar emails automaticamente
- Bypassar políticas RLS quando necessário
- Operações administrativas que requerem privilégios elevados

---

**📅 Data de criação:** 2026-06-19  
**📌 Versão:** 1.0.0  
**👤 Autor:** Sistema de Gestão de Quermesse  
**🔄 Última atualização:** 2026-06-19