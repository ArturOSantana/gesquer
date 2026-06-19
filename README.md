# QuermesseOn!

Sistema completo de gestão de quermesse com controle de cartões, vendas, estoque e transferências.

## 🚀 Stack Tecnológica

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + BaaS)
- **State Management**: Zustand
- **Routing**: React Router v6
- **QR Code**: html5-qrcode + qrcode
- **Deploy**: Vercel

## 📋 Funcionalidades

### Core
- ✅ Geração e leitura de QR Codes
- ✅ Gestão de cartões e saldos
- ✅ Sistema de vendas com carrinho
- ✅ Controle de estoque em tempo real
- ✅ Transferência de saldo entre cartões
- ✅ Histórico completo de transações
- ✅ Relatórios e exportação de dados

### Perfis de Usuário
- **Admin**: Acesso total ao sistema
- **Caixa**: Recarga de cartões e consultas
- **Barraca**: Vendas e gestão de estoque

## 🛠️ Setup do Projeto

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local

# Configurar variáveis de ambiente no .env.local
# VITE_SUPABASE_URL=sua-url
# VITE_SUPABASE_ANON_KEY=sua-chave

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🗄️ Configuração do Banco de Dados

1. Criar projeto no Supabase
2. Acessar SQL Editor
3. Executar o script SQL completo (ver `especificacao-tecnica-completa.md`)
4. Verificar criação de tabelas, views, stored procedures e RLS

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes React
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Layout components
│   ├── qr/          # QR Code components
│   ├── cards/       # Card management
│   ├── sales/       # Sales components
│   ├── stock/       # Stock management
│   └── transactions/# Transaction history
├── pages/           # Páginas da aplicação
├── lib/             # Utilitários e configurações
├── hooks/           # Custom React hooks
├── store/           # Zustand store
└── styles/          # Estilos globais
```

## 🔒 Segurança

- Row Level Security (RLS) no Supabase
- Validações client-side e server-side
- Idempotência em transações críticas
- Prevenção de race conditions
- Auditoria completa de operações

## 📱 PWA

O sistema é configurado como Progressive Web App, permitindo:
- Instalação no dispositivo
- Funcionamento offline (cache)
- Notificações push (futuro)

## 🚀 Deploy

### Vercel (Recomendado)

O sistema está otimizado para deploy na Vercel com configuração automática.

#### Deploy Rápido

1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "Deploy inicial"
   git push origin main
   ```

2. **Importar na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "Add New Project"
   - Selecione seu repositório
   - Clique em "Import"

3. **Configurar Variáveis de Ambiente** ⚠️ **IMPORTANTE**
   
   Na Vercel, vá em **Settings → Environment Variables** e adicione:
   
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```
   
   **Sem essas variáveis, a aplicação mostrará tela em branco!**

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build (1-2 minutos)
   - Acesse a URL fornecida

#### Guia Completo

Para instruções detalhadas, incluindo troubleshooting e configurações avançadas, consulte:

📖 **[VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md)** - Guia completo de deploy

#### Troubleshooting Rápido

**Tela em branco após deploy?**
- ✅ Verifique se configurou as variáveis de ambiente
- ✅ Faça um redeploy após adicionar as variáveis
- ✅ Verifique o console do navegador (F12) para erros

**Build falhou?**
- ✅ Teste localmente: `npm run build`
- ✅ Verifique os logs na Vercel
- ✅ Certifique-se que todas as dependências estão no package.json

#### Deploy via CLI (Opcional)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

**Nota:** Ainda assim, você precisa configurar as variáveis de ambiente no dashboard da Vercel.

## 📊 Monitoramento

- Logs de auditoria no Supabase
- Métricas de performance
- Alertas de estoque baixo
- Relatórios de vendas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para dúvidas e suporte, consulte a documentação técnica completa em `especificacao-tecnica-completa.md`.