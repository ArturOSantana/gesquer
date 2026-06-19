# 🔧 Guia de Configuração do Supabase

Este guia fornece instruções passo a passo para configurar o Supabase para o Sistema de Quermesse.

## 📋 Índice

1. [Criar Conta no Supabase](#1-criar-conta-no-supabase)
2. [Criar Novo Projeto](#2-criar-novo-projeto)
3. [Configurar Banco de Dados](#3-configurar-banco-de-dados)
4. [Obter Credenciais](#4-obter-credenciais)
5. [Configurar Variáveis de Ambiente](#5-configurar-variáveis-de-ambiente)
6. [Testar Conexão](#6-testar-conexão)
7. [Solução de Problemas](#7-solução-de-problemas)

---

## 1. Criar Conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Faça login com:
   - GitHub (recomendado)
   - Google
   - Email

---

## 2. Criar Novo Projeto

1. No dashboard do Supabase, clique em **"New Project"**
2. Preencha as informações:
   - **Name**: `quermesse-system` (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (anote em local seguro!)
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (suficiente para começar)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos enquanto o projeto é criado

---

## 3. Configurar Banco de Dados

### 3.1. Acessar o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 3.2. Executar Script de Criação

Copie e cole o conteúdo do arquivo `database/schema.sql` no editor SQL e execute:

```sql
-- O script completo está em database/schema.sql
-- Ele criará todas as tabelas necessárias:
-- - clients (clientes)
-- - cards (cartões)
-- - barracas (barracas)
-- - products (produtos)
-- - sales (vendas)
-- - sale_items (itens de venda)
-- - transactions (transações)
-- - card_batches (lotes de cartões)
```

### 3.3. Verificar Tabelas Criadas

1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver todas as tabelas listadas:
   - ✅ clients
   - ✅ cards
   - ✅ barracas
   - ✅ products
   - ✅ sales
   - ✅ sale_items
   - ✅ transactions
   - ✅ card_batches

### 3.4. Configurar Políticas de Segurança (RLS)

Por padrão, o Row Level Security (RLS) está desabilitado para facilitar o desenvolvimento. Para produção, você deve:

1. Ir em **"Authentication"** > **"Policies"**
2. Habilitar RLS para cada tabela
3. Criar políticas apropriadas

**Para desenvolvimento local, você pode manter RLS desabilitado.**

---

## 4. Obter Credenciais

### 4.1. URL do Projeto

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Copie a **"Project URL"**
   - Formato: `https://xxxxxxxxxxxxx.supabase.co`

### 4.2. Chave Anônima (Anon Key)

1. Na mesma página de API
2. Em **"Project API keys"**, copie a **"anon public"** key
   - É uma string longa começando com `eyJ...`

---

## 5. Configurar Variáveis de Ambiente

### 5.1. Criar Arquivo .env.local

1. Na raiz do projeto, crie o arquivo `.env.local` (se não existir)
2. Cole o seguinte conteúdo:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Configurações da aplicação
VITE_APP_NAME=Sistema de Quermesse
VITE_APP_VERSION=1.0.0

# Limites
VITE_MAX_CART_ITEMS=50
VITE_MAX_TRANSFER_AMOUNT=1000
VITE_MIN_RECHARGE_AMOUNT=10

# Features (opcional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

### 5.2. Substituir Valores

Substitua os valores de exemplo pelas suas credenciais reais:

- `VITE_SUPABASE_URL`: Cole a URL do seu projeto
- `VITE_SUPABASE_ANON_KEY`: Cole a chave anônima

### 5.3. Exemplo Completo

```env
# Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjc1ODQwMCwiZXhwIjoxOTQ4MzM0NDAwfQ.abcdefghijklmnopqrstuvwxyz1234567890

# Configurações da aplicação
VITE_APP_NAME=Sistema de Quermesse
VITE_APP_VERSION=1.0.0

# Limites
VITE_MAX_CART_ITEMS=50
VITE_MAX_TRANSFER_AMOUNT=1000
VITE_MIN_RECHARGE_AMOUNT=10

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

---

## 6. Testar Conexão

### 6.1. Reiniciar Servidor de Desenvolvimento

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 6.2. Verificar Console do Navegador

1. Abra o navegador em `http://localhost:5173`
2. Abra o Console do Desenvolvedor (F12)
3. Procure por mensagens:
   - ✅ `Conexão com Supabase estabelecida com sucesso!`
   - ❌ Se houver erro, veja a seção de [Solução de Problemas](#7-solução-de-problemas)

### 6.3. Testar Funcionalidades

1. Tente criar uma barraca
2. Tente gerar um cartão
3. Verifique se os dados aparecem no Supabase:
   - Vá em **"Table Editor"**
   - Selecione a tabela
   - Veja os registros criados

---

## 7. Solução de Problemas

### ❌ Erro: "Missing Supabase environment variables"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis estão corretas
3. Reinicie o servidor de desenvolvimento

### ❌ Erro: "Supabase environment variables not configured properly"

**Causa**: Valores ainda estão com placeholders

**Solução**:
1. Substitua `https://your-project.supabase.co` pela URL real
2. Substitua `your-anon-key` pela chave real
3. Reinicie o servidor

### ❌ Erro: "Failed to fetch" ou "Network Error"

**Causa**: Problemas de conexão ou URL incorreta

**Solução**:
1. Verifique sua conexão com a internet
2. Confirme que a URL do Supabase está correta
3. Verifique se o projeto Supabase está ativo (não pausado)

### ❌ Erro: "Invalid API key"

**Causa**: Chave anônima incorreta ou expirada

**Solução**:
1. Volte ao Supabase Dashboard
2. Vá em Settings > API
3. Copie novamente a chave anônima
4. Atualize o `.env.local`

### ❌ Erro: "relation does not exist" ou "table not found"

**Causa**: Tabelas não foram criadas

**Solução**:
1. Vá no SQL Editor do Supabase
2. Execute o script `database/schema.sql` novamente
3. Verifique se todas as tabelas foram criadas

### ❌ Erro: "permission denied" ou "RLS policy violation"

**Causa**: Row Level Security está habilitado sem políticas

**Solução**:
1. Vá em Authentication > Policies
2. Desabilite RLS para desenvolvimento
3. Ou crie políticas apropriadas

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

```
clients (clientes)
├── id (uuid, PK)
├── name (text)
├── phone (text)
├── email (text)
├── cpf (text)
└── created_at (timestamp)

cards (cartões)
├── id (uuid, PK)
├── uuid (uuid, unique) - Para QR Code
├── client_id (uuid, FK -> clients)
├── balance (decimal)
├── status (text)
└── created_at (timestamp)

barracas (barracas)
├── id (uuid, PK)
├── name (text)
├── description (text)
├── responsible (text)
├── status (text)
└── created_at (timestamp)

products (produtos)
├── id (uuid, PK)
├── barraca_id (uuid, FK -> barracas)
├── name (text)
├── description (text)
├── price (decimal)
├── stock_quantity (integer)
├── status (text)
└── created_at (timestamp)

sales (vendas)
├── id (uuid, PK)
├── card_id (uuid, FK -> cards)
├── barraca_id (uuid, FK -> barracas)
├── total_amount (decimal)
└── created_at (timestamp)

sale_items (itens de venda)
├── id (uuid, PK)
├── sale_id (uuid, FK -> sales)
├── product_id (uuid, FK -> products)
├── quantity (integer)
├── unit_price (decimal)
└── subtotal (decimal)

transactions (transações)
├── id (uuid, PK)
├── card_id (uuid, FK -> cards)
├── type (text) - recharge, sale, transfer
├── amount (decimal)
├── balance_after (decimal)
├── description (text)
└── created_at (timestamp)
```

---

## 🔐 Segurança

### Para Desenvolvimento
- RLS pode ficar desabilitado
- Use a chave anônima (anon key)

### Para Produção
- **Habilite RLS em todas as tabelas**
- Configure políticas de segurança apropriadas
- Use autenticação de usuários
- Considere usar a service role key apenas no backend

---

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de SQL](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)

---

## ✅ Checklist de Configuração

- [ ] Conta criada no Supabase
- [ ] Projeto criado
- [ ] Script SQL executado
- [ ] Tabelas verificadas no Table Editor
- [ ] URL do projeto copiada
- [ ] Chave anônima copiada
- [ ] Arquivo `.env.local` criado
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor reiniciado
- [ ] Conexão testada com sucesso
- [ ] Funcionalidades básicas testadas

---

## 🆘 Suporte

Se você encontrar problemas não listados aqui:

1. Verifique o console do navegador para erros detalhados
2. Verifique os logs do Supabase Dashboard
3. Consulte a documentação oficial do Supabase
4. Revise o arquivo `src/lib/supabase.js` para mensagens de erro específicas

---

**Última atualização**: 2024
**Versão do Sistema**: 1.0.0