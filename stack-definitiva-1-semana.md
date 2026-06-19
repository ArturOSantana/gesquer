# Stack Definitiva - Sistema de Quermesse (1 Semana)

## Contexto Atualizado

**Requisitos Críticos:**
- Prazo: 1 SEMANA (7 dias)
- Usuários simultâneos: 20
- Custo: Zero
- Performance: Não pode travar
- Interface: Profissional
- Banco: Remoto obrigatório
- Acesso: Web mobile apenas

**Mudança de Estratégia:**
Com apenas 1 semana, a prioridade absoluta é VELOCIDADE DE DESENVOLVIMENTO. Complexidade técnica deve ser minimizada ao máximo.

---

## Análise Rápida das Propostas

### Proposta 1: Svelte/Vue + SQLite + Raspberry Pi
**Tempo estimado:** 10-14 dias
**Veredicto:** ❌ ELIMINADA - SQLite local viola requisito + setup de hardware consome tempo

### Proposta 2: Next.js + Fastify + PostgreSQL + Railway
**Tempo estimado:** 7-10 dias
**Veredicto:** ⚠️ ARRISCADO - Next.js adiciona complexidade desnecessária para prazo apertado

### Proposta 3: Flutter Web + Spring Boot + PostgreSQL + AWS
**Tempo estimado:** 14-21 dias
**Veredicto:** ❌ ELIMINADA - Curva de aprendizado inviável para 1 semana

### Proposta 4: React + Vite + Tailwind + Fastify + Supabase
**Tempo estimado:** 5-7 dias
**Veredicto:** ✅ VIÁVEL - Mas precisa de simplificações

---

## Stack Definitiva: React + Vite + Tailwind + Supabase (Backend-as-a-Service)

### Decisão Crítica: ELIMINAR BACKEND CUSTOMIZADO

Para entregar em 1 semana, vamos usar Supabase como backend completo, eliminando a necessidade de desenvolver API própria.

### Arquitetura Simplificada

```
┌─────────────────────────────────────┐
│      CLIENTE (Mobile Browser)       │
│         React + Vite App            │
└──────────────┬──────────────────────┘
               │
               │ HTTPS (Supabase Client)
               │
┌──────────────▼──────────────────────┐
│          SUPABASE                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  PostgreSQL Database        │   │
│  │  - Auto REST API            │   │
│  │  - Row Level Security       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Real-time Subscriptions    │   │
│  │  - Stock updates            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Storage                    │   │
│  │  - QR Code images (opt)     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Justificativa Técnica da Stack

### Frontend: React + Vite

**Por que React:**
- Biblioteca mais popular (documentação abundante)
- Copilot/ChatGPT geram código React melhor
- Componentes prontos disponíveis (shadcn/ui)
- Hooks simplificam lógica de estado

**Por que Vite:**
- Setup instantâneo: `npm create vite@latest`
- Zero configuração necessária
- HMR instantâneo (desenvolvimento rápido)
- Build otimizado automático

**Tempo economizado:** 1-2 dias vs configurar Webpack/Next.js

### UI: Tailwind CSS + shadcn/ui

**Por que Tailwind:**
- Desenvolvimento 3x mais rápido que CSS puro
- Sem conflitos de CSS
- Responsivo por padrão
- Purge automático (bundle pequeno)

**Por que shadcn/ui:**
- Componentes prontos e customizáveis
- Copy-paste (não é dependência)
- Design profissional out-of-the-box
- Acessibilidade incluída

**Tempo economizado:** 2-3 dias vs criar componentes do zero

### Backend: Supabase (Backend-as-a-Service)

**Por que ELIMINAR backend customizado:**
- Supabase gera REST API automaticamente
- Row Level Security substitui middleware de auth
- Real-time subscriptions nativo
- Não precisa escrever rotas, controllers, validações
- Não precisa fazer deploy de backend

**Funcionalidades incluídas:**
- PostgreSQL gerenciado
- API REST auto-gerada
- Real-time WebSocket
- Auth (se necessário)
- Storage para arquivos
- Dashboard administrativo

**Tempo economizado:** 3-4 dias vs desenvolver API do zero

### Hosting: Vercel

**Por que Vercel:**
- Deploy em 2 minutos
- Git push = deploy automático
- Free tier ilimitado
- CDN global
- Zero configuração

**Tempo economizado:** 1 dia vs configurar Railway + CI/CD

---

## Comparação: Com vs Sem Backend Customizado

| Aspecto | Com Fastify | Sem Backend (Supabase) |
|---------|-------------|------------------------|
| Rotas API | Escrever manualmente | Auto-gerado |
| Validação | JSON Schema manual | PostgreSQL constraints |
| Auth/Security | Middleware custom | Row Level Security |
| Real-time | WebSocket manual | Nativo |
| Deploy | Railway setup | Não necessário |
| Manutenção | Código próprio | Gerenciado |
| **Tempo Dev** | **4-5 dias** | **1 dia** |

**Economia de tempo:** 3-4 dias

---

## Schema do Banco de Dados

```sql
-- Cartões
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code TEXT UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Barracas
CREATE TABLE barracas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estoque
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barraca_id UUID REFERENCES barracas(id),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id),
  barraca_id UUID REFERENCES barracas(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'refund', 'transfer')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transferências
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_card_id UUID REFERENCES cards(id),
  to_card_id UUID REFERENCES cards(id),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_cards_qr ON cards(qr_code);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_barraca ON transactions(barraca_id);
CREATE INDEX idx_stock_barraca ON stock(barraca_id);
```

---

## Plano de Implementação (7 dias)

### Dia 1: Setup e Infraestrutura (4h)
- [ ] Criar projeto: `npm create vite@latest quermesse -- --template react`
- [ ] Instalar dependências: Tailwind, shadcn/ui, Supabase client
- [ ] Configurar Tailwind CSS
- [ ] Setup Supabase (criar projeto, database)
- [ ] Criar schema do banco (SQL acima)
- [ ] Deploy inicial Vercel

**Entregável:** App rodando em produção (vazio)

### Dia 2: QR Code e Cartões (6h)
- [ ] Instalar `html5-qrcode` para scanner
- [ ] Componente de leitura de QR Code
- [ ] Tela de consulta de saldo
- [ ] Integração com Supabase (query cards)
- [ ] Validação de QR Code

**Entregável:** Scanner funcional + consulta de saldo

### Dia 3: Sistema de Transações (6h)
- [ ] Tela de venda (barraca)
- [ ] Seleção de produtos do estoque
- [ ] Cálculo de total
- [ ] Confirmação de compra
- [ ] Atualização de saldo (Supabase)
- [ ] Registro de transação

**Entregável:** Fluxo completo de venda

### Dia 4: Gestão de Estoque (6h)
- [ ] CRUD de produtos por barraca
- [ ] Atualização de quantidade
- [ ] Atualização de preços
- [ ] Listagem de estoque
- [ ] Filtros por barraca

**Entregável:** Gestão completa de estoque

### Dia 5: Transferências e Histórico (6h)
- [ ] Tela de transferência entre cartões
- [ ] Validação de saldo suficiente
- [ ] Histórico de transações por cartão
- [ ] Histórico de vendas por barraca
- [ ] Filtros de data

**Entregável:** Transferências + histórico completo

### Dia 6: Interface e UX (6h)
- [ ] Design system com Tailwind
- [ ] Componentes shadcn/ui customizados
- [ ] Loading states
- [ ] Error handling
- [ ] Feedback visual (toasts)
- [ ] Responsividade mobile

**Entregável:** Interface profissional e polida

### Dia 7: Testes e Deploy Final (6h)
- [ ] Testes manuais de todos os fluxos
- [ ] Teste com 20 usuários simultâneos
- [ ] Correção de bugs críticos
- [ ] Otimização de queries
- [ ] Deploy final
- [ ] Documentação básica

**Entregável:** Sistema completo em produção

---

## Bibliotecas Essenciais

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "html5-qrcode": "^2.3.8",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.7",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**Total de dependências:** 9 (mínimo absoluto)

---

## Estrutura de Pastas

```
quermesse/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── QRScanner.jsx
│   │   ├── CardBalance.jsx
│   │   ├── ProductList.jsx
│   │   └── TransactionHistory.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Scan.jsx
│   │   ├── Sale.jsx
│   │   ├── Stock.jsx
│   │   └── Transfer.jsx
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   └── utils.js
│   ├── store/
│   │   └── useStore.js      # Zustand store
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

**Total de arquivos:** ~20 (mínimo para funcionalidade completa)

---

## Estimativa de Performance

### Bundle Size
- React + React DOM: 45KB
- Supabase client: 25KB
- html5-qrcode: 30KB
- Tailwind (purged): 10KB
- App code: 15KB
- **Total: ~125KB gzipped**

### Latência
- First Contentful Paint: <2s
- Time to Interactive: <3s
- Supabase query: 50-150ms
- QR scan: <500ms

### Capacidade
- 20 usuários simultâneos: ✅ Suportado
- 500 transações/dia: ✅ Suportado
- Supabase free tier: ✅ Suficiente

---

## Mitigação de Riscos (1 semana)

### Risco 1: Não terminar no prazo

**Mitigação:**
- Usar componentes prontos (shadcn/ui)
- Copiar código de exemplos do Supabase
- Focar em MVP (sem features extras)
- Trabalhar 6h/dia focado

### Risco 2: Bugs em produção

**Mitigação:**
- Testar cada feature antes de prosseguir
- Usar TypeScript para validação (opcional)
- Logging com Supabase
- Rollback fácil no Vercel

### Risco 3: Performance ruim

**Mitigação:**
- Supabase tem CDN global
- Vercel tem edge network
- Lazy loading de rotas
- Índices no banco (já incluídos)

### Risco 4: Custo inesperado

**Mitigação:**
- Supabase free tier: 500MB DB, 2GB bandwidth
- Vercel free tier: ilimitado
- Monitorar uso no dashboard
- 20 usuários está muito abaixo dos limites

---

## Comparação Final: Por que esta Stack?

| Critério | Proposta 2 (Next.js) | Proposta 4 (React+Fastify) | Stack Definitiva |
|----------|---------------------|---------------------------|------------------|
| Tempo Dev | 7-10 dias | 7-9 dias | **5-7 dias** |
| Complexidade | Média | Média | **Baixa** |
| Linhas de código | ~2000 | ~1800 | **~1200** |
| Deploy steps | 2 (front+back) | 2 (front+back) | **1 (front)** |
| Manutenção | Média | Média | **Baixa** |
| Custo | $0 | $0 | **$0** |
| Risco | Médio | Médio | **Baixo** |

---

## Conclusão

A stack **React + Vite + Tailwind + Supabase (BaaS) + Vercel** é a única viável para 1 semana porque:

1. **Elimina 3-4 dias de desenvolvimento** ao usar Supabase como backend completo
2. **Reduz complexidade** de 2 deploys para 1
3. **Componentes prontos** (shadcn/ui) economizam 2-3 dias
4. **Zero configuração** de build tools (Vite)
5. **Custo zero** garantido
6. **Performance confiável** para 20 usuários
7. **Manutenção mínima** (tudo gerenciado)

**Decisão crítica:** Não desenvolver backend customizado. Supabase oferece tudo que precisamos via API auto-gerada, economizando 50% do tempo de desenvolvimento.

Com esta stack, é possível entregar um sistema completo e profissional em 5-7 dias de trabalho focado.