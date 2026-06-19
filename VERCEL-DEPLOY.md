# 🚀 Guia Completo de Deploy na Vercel

Este guia explica passo a passo como fazer o deploy do Sistema de Quermesse na Vercel.

## 📋 Pré-requisitos

1. Conta no GitHub (gratuita)
2. Conta na Vercel (gratuita) - https://vercel.com
3. Conta no Supabase (gratuita) - https://supabase.com
4. Projeto configurado no Supabase (veja CONFIGURACAO-SUPABASE.md)

## 🔧 Passo 1: Preparar o Repositório

### 1.1 Criar Repositório no GitHub

```bash
# Se ainda não criou o repositório
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/quermesse.git
git push -u origin main
```

### 1.2 Verificar Arquivos Importantes

Certifique-se de que estes arquivos estão no repositório:
- ✅ `vercel.json` - Configurações de build
- ✅ `.env.example` - Exemplo de variáveis (SEM valores reais)
- ✅ `.gitignore` - Deve incluir `.env.local` e `.env`

**⚠️ IMPORTANTE:** Nunca commite arquivos `.env.local` ou `.env` com credenciais reais!

## 🌐 Passo 2: Configurar Projeto na Vercel

### 2.1 Importar Projeto

1. Acesse https://vercel.com
2. Clique em **"Add New..."** → **"Project"**
3. Selecione seu repositório do GitHub
4. Clique em **"Import"**

### 2.2 Configurar Build Settings

A Vercel detecta automaticamente que é um projeto Vite. Verifique:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

✅ Geralmente não precisa alterar nada aqui!

## 🔐 Passo 3: Configurar Variáveis de Ambiente

**ESTE É O PASSO MAIS IMPORTANTE!** Sem as variáveis de ambiente, a aplicação mostrará tela em branco.

### 3.1 Obter Credenciais do Supabase

1. Acesse seu projeto no Supabase: https://app.supabase.com
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** (exemplo: `https://xyzabc123.supabase.co`)
   - **anon/public key** (uma chave longa começando com `eyJ...`)

### 3.2 Adicionar na Vercel

Na página de configuração do projeto na Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

#### Variáveis Obrigatórias:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase | `https://xyzabc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

#### Variáveis Opcionais:

| Nome | Valor Padrão | Descrição |
|------|--------------|-----------|
| `VITE_APP_NAME` | Sistema de Quermesse | Nome da aplicação |
| `VITE_APP_VERSION` | 1.0.0 | Versão da aplicação |
| `VITE_MAX_CART_ITEMS` | 50 | Máximo de itens no carrinho |
| `VITE_MAX_TRANSFER_AMOUNT` | 1000 | Valor máximo de transferência |
| `VITE_MIN_RECHARGE_AMOUNT` | 10 | Valor mínimo de recarga |

### 3.3 Configurar Ambientes

Para cada variável, selecione os ambientes:
- ✅ **Production** (obrigatório)
- ✅ **Preview** (recomendado)
- ✅ **Development** (opcional)

### 3.4 Exemplo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ Environment Variables                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Name: VITE_SUPABASE_URL                                     │
│ Value: https://xyzabc123.supabase.co                        │
│ Environments: ☑ Production ☑ Preview ☐ Development         │
│                                                              │
│ Name: VITE_SUPABASE_ANON_KEY                                │
│ Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...             │
│ Environments: ☑ Production ☑ Preview ☐ Development         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Passo 4: Deploy

### 4.1 Primeiro Deploy

Após configurar as variáveis:

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 1-2 minutos)
3. Vercel mostrará a URL do seu site

### 4.2 Redeploy (se já fez deploy antes)

Se você já tinha feito deploy mas estava com tela em branco:

1. Vá em **Deployments**
2. Clique nos **três pontos** do último deployment
3. Selecione **"Redeploy"**
4. Confirme

## ✅ Passo 5: Verificar Deploy

### 5.1 Acessar o Site

1. Clique na URL fornecida pela Vercel (exemplo: `https://quermesse.vercel.app`)
2. Você deve ver a tela inicial do sistema

### 5.2 Verificar Console do Navegador

Abra o DevTools (F12) e verifique o Console:

✅ **Sucesso:**
```
✅ Supabase configurado corretamente
```

❌ **Erro (variáveis não configuradas):**
```
⚠️ Supabase não configurado - usando cliente mock
```

### 5.3 Testar Funcionalidades

1. Navegue pelas páginas
2. Tente escanear um QR code
3. Verifique se os dados carregam

## 🔧 Troubleshooting

### Problema: Tela em Branco

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Verifique se adicionou `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
2. Certifique-se que os valores estão corretos (sem espaços extras)
3. Faça um redeploy após adicionar as variáveis

### Problema: Erro 404 ao Navegar

**Causa:** Configuração de rotas SPA

**Solução:**
- Verifique se o arquivo `vercel.json` existe e tem a configuração de rewrites
- Faça um novo deploy

### Problema: Build Falha

**Causa:** Erro no código ou dependências

**Solução:**
1. Verifique os logs de build na Vercel
2. Teste o build localmente: `npm run build`
3. Corrija os erros e faça novo commit

### Problema: Variáveis Não Funcionam

**Causa:** Variáveis adicionadas após o deploy

**Solução:**
- Sempre faça um **redeploy** após adicionar/modificar variáveis de ambiente
- As variáveis só são aplicadas em novos builds

## 📱 Passo 6: Configurar Domínio Customizado (Opcional)

### 6.1 Adicionar Domínio

1. Vá em **Settings** → **Domains**
2. Clique em **"Add"**
3. Digite seu domínio (exemplo: `quermesse.suaescola.com.br`)
4. Siga as instruções para configurar DNS

### 6.2 Configurar DNS

Adicione um registro CNAME no seu provedor de DNS:

```
Type: CNAME
Name: quermesse (ou @)
Value: cname.vercel-dns.com
```

## 🔄 Passo 7: Deploys Automáticos

### 7.1 Configuração Padrão

A Vercel faz deploy automático quando você:
- ✅ Faz push para a branch `main` (Production)
- ✅ Abre um Pull Request (Preview)

### 7.2 Desabilitar Deploy Automático (Opcional)

1. Vá em **Settings** → **Git**
2. Configure **Production Branch** e **Preview Branches**

## 📊 Monitoramento

### 7.1 Analytics

A Vercel fornece analytics gratuitos:
- Visualizações de página
- Tempo de carregamento
- Erros

Acesse em: **Analytics** no menu do projeto

### 7.2 Logs

Para ver logs em tempo real:
1. Vá em **Deployments**
2. Clique no deployment ativo
3. Vá em **Functions** → **Logs**

## 🔒 Segurança

### Checklist de Segurança:

- ✅ Variáveis de ambiente configuradas na Vercel (não no código)
- ✅ `.env.local` e `.env` no `.gitignore`
- ✅ Apenas `.env.example` commitado (sem valores reais)
- ✅ HTTPS habilitado (automático na Vercel)
- ✅ Headers de segurança configurados no `vercel.json`

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Vite](https://vitejs.dev/guide/)
- [Documentação Supabase](https://supabase.com/docs)
- [CONFIGURACAO-SUPABASE.md](./CONFIGURACAO-SUPABASE.md) - Configurar banco de dados

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de build na Vercel
2. Verifique o console do navegador (F12)
3. Consulte este guia novamente
4. Verifique se as variáveis de ambiente estão corretas

## 📝 Resumo Rápido

```bash
# 1. Push para GitHub
git push origin main

# 2. Importar na Vercel
# - Conectar repositório
# - Configurar variáveis de ambiente

# 3. Deploy
# - Vercel faz automaticamente

# 4. Verificar
# - Acessar URL fornecida
# - Testar funcionalidades
```

---

**✨ Pronto!** Seu sistema está no ar e acessível para todos!

**🔗 URL de Exemplo:** `https://seu-projeto.vercel.app`

---

Made with ❤️ by Bob