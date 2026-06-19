# Instruções de Setup - Sistema de Quermesse

## ✅ DIA 1 - Setup e Infraestrutura (CONCLUÍDO)

Todas as configurações iniciais foram criadas com sucesso:

### Arquivos Criados:
- ✅ Configuração do projeto (package.json, vite.config.js, etc.)
- ✅ Configuração do Tailwind CSS
- ✅ Configuração do Supabase client
- ✅ Estrutura de pastas completa
- ✅ Arquivos de configuração (jsconfig.json, components.json)
- ✅ Páginas básicas (Home, Dashboard, etc.)
- ✅ Layout e Header com navegação
- ✅ Utilitários e validadores
- ✅ Repositório Git inicializado

## 📋 Próximos Passos

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências listadas no package.json:
- React 18 + React DOM
- React Router v6
- Supabase JS Client
- Zustand (state management)
- Tailwind CSS + PostCSS + Autoprefixer
- html5-qrcode + qrcode
- date-fns
- lucide-react (ícones)
- Vite e plugins

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Configurar Banco de Dados no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá para SQL Editor
4. Execute o script SQL completo da seção 3 do arquivo `especificacao-tecnica-completa.md`
5. Verifique se todas as tabelas foram criadas

### 4. Instalar Componentes shadcn/ui

Execute os comandos para instalar os componentes necessários:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add separator
```

### 5. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em: http://localhost:3000

### 6. Verificar Funcionamento

Acesse as seguintes páginas para verificar se tudo está funcionando:

- ✅ Home: http://localhost:3000/
- ✅ Dashboard: http://localhost:3000/dashboard
- ✅ Escanear: http://localhost:3000/scan
- ✅ Venda: http://localhost:3000/sale
- ✅ Estoque: http://localhost:3000/stock
- ✅ Transferir: http://localhost:3000/transfer
- ✅ Histórico: http://localhost:3000/history
- ✅ Barracas: http://localhost:3000/barracas
- ✅ Cartões: http://localhost:3000/cards
- ✅ Relatórios: http://localhost:3000/reports

## 🚀 Próxima Fase: DIA 2 - QR Code e Cartões

Após confirmar que o setup está funcionando, começaremos a implementar:

1. **Geração de QR Code** - Componente para gerar QR codes dos cartões
2. **Scanner de QR Code** - Componente para ler QR codes usando a câmera
3. **Componentes de Cartão** - CardBalance, CardList, CardForm, CardDetails
4. **CRUD de Cartões** - Criar, ler, atualizar e deletar cartões
5. **Hook useCards** - Hook customizado para gerenciar estado dos cartões

## 📝 Notas Importantes

### Dependências Principais:
- **React 18**: Framework UI
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework CSS utility-first
- **Supabase**: Backend as a Service (PostgreSQL + Auth + Storage)
- **React Router v6**: Roteamento
- **Zustand**: State management leve
- **html5-qrcode**: Scanner de QR Code
- **qrcode**: Gerador de QR Code
- **lucide-react**: Biblioteca de ícones

### Estrutura de Pastas:
```
src/
├── components/       # Componentes React reutilizáveis
│   ├── ui/          # Componentes shadcn/ui
│   ├── layout/      # Layout e navegação
│   ├── qr/          # QR Code components
│   ├── cards/       # Gestão de cartões
│   ├── sales/       # Sistema de vendas
│   ├── stock/       # Gestão de estoque
│   └── ...
├── pages/           # Páginas da aplicação
├── lib/             # Utilitários e configurações
├── hooks/           # Custom React hooks
├── store/           # Zustand store
└── styles/          # Estilos globais
```

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas

### Erro ao instalar dependências
- Limpe o cache: `npm cache clean --force`
- Delete node_modules e package-lock.json
- Execute `npm install` novamente

### Tailwind não está funcionando
- Verifique se o arquivo `src/styles/globals.css` está sendo importado no `main.jsx`
- Confirme que o `tailwind.config.js` está configurado corretamente

### shadcn/ui não instala
- Verifique se o arquivo `components.json` existe
- Execute `npx shadcn-ui@latest init` se necessário

## 📚 Recursos

- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do React](https://react.dev/)
- [Documentação do Tailwind CSS](https://tailwindcss.com/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do shadcn/ui](https://ui.shadcn.com/)
- [Especificação Técnica Completa](./especificacao-tecnica-completa.md)

## ✅ Checklist de Verificação

Antes de prosseguir para o DIA 2, confirme:

- [ ] Todas as dependências instaladas sem erros
- [ ] Arquivo .env.local configurado com credenciais do Supabase
- [ ] Projeto rodando em http://localhost:3000
- [ ] Navegação entre páginas funcionando
- [ ] Tailwind CSS aplicado corretamente
- [ ] Componentes shadcn/ui instalados
- [ ] Banco de dados Supabase criado e configurado

---

**Status Atual**: DIA 1 CONCLUÍDO ✅  
**Próximo**: DIA 2 - QR Code e Cartões