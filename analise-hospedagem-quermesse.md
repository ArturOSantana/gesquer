# Análise Comparativa de Hospedagem - Sistema de Quermesse

## 📋 Sumário Executivo

Este documento apresenta uma análise técnica detalhada das principais plataformas de hospedagem para o sistema de quermesse, considerando os requisitos específicos do projeto:

- **Stack**: React 18 + Vite + Supabase
- **Requisito crítico**: HTTPS para acesso à câmera (getUserMedia API)
- **Perfil de uso**: Volume baixo (até 50 usuários simultâneos), eventos mensais
- **Orçamento**: Plano gratuito inicialmente
- **Domínio**: Usar domínio fornecido pela plataforma

---

## 🎯 Requisitos do Projeto

### Técnicos
- ✅ Build com Vite (ESM)
- ✅ HTTPS obrigatório (câmera)
- ✅ Variáveis de ambiente (Supabase)
- ✅ SPA com React Router
- ✅ PWA capabilities
- ✅ Deploy automático via Git

### Operacionais
- 📊 Até 50 usuários simultâneos
- 📅 Uso mensal (eventos)
- 💰 Custo zero ou mínimo
- 🚀 Deploy rápido e simples
- 📱 Acesso mobile otimizado

---

## 1️⃣ VERCEL

### 💰 Custo

**Plano Hobby (Gratuito)**
- ✅ 100 GB bandwidth/mês
- ✅ Builds ilimitados
- ✅ Deploy automático
- ✅ HTTPS automático
- ✅ Domínio .vercel.app

**Plano Pro ($20/mês)**
- 1 TB bandwidth
- Analytics avançado
- Proteção DDoS
- Domínios customizados ilimitados

**Estimativa para o projeto**: R$ 0/mês (Hobby suficiente)

### 🚀 Facilidade de Deploy

**Pontuação: 10/10**

- ✅ Integração nativa com GitHub/GitLab/Bitbucket
- ✅ Deploy automático em cada push
- ✅ Preview automático de PRs
- ✅ Zero configuração para Vite
- ✅ CLI poderosa (`vercel`)
- ⚡ Tempo de build: ~1-2 minutos
- ⚡ Tempo de deploy: ~30 segundos

**Configuração necessária**:
```bash
# Instalar CLI
npm i -g vercel

# Deploy (primeira vez)
vercel

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### ⚡ Performance

**Pontuação: 10/10**

- 🌍 **CDN Global**: Edge Network em 100+ cidades
- 📊 **Uptime**: 99.99% SLA
- ⚡ **TTFB**: <50ms (média global)
- 🚀 **Edge Functions**: Suporte nativo
- 📦 **Compressão**: Brotli automático
- 🎯 **Smart CDN**: Cache inteligente

**Métricas esperadas**:
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Lighthouse Score: 95+

### 🎁 Recursos

| Recurso | Hobby | Pro |
|---------|-------|-----|
| HTTPS Automático | ✅ | ✅ |
| Domínio Customizado | 1 | ∞ |
| Variáveis de Ambiente | ✅ | ✅ |
| Preview Branches | ✅ | ✅ |
| Analytics | Básico | Avançado |
| Logs | 1 dia | 30 dias |
| Proteção DDoS | ❌ | ✅ |
| Suporte | Community | Email |

### 📊 Limitações

**Plano Hobby**:
- ⚠️ 100 GB bandwidth/mês (~200k pageviews)
- ⚠️ 100 GB-hours serverless/mês
- ⚠️ 6.000 minutos de build/mês
- ⚠️ 1 domínio customizado
- ⚠️ Logs de 1 dia apenas

**Para o projeto**: Todas as limitações são mais que suficientes

### ✅ Adequação ao Projeto

**Pontuação: 10/10**

- ✅ **Vite**: Suporte nativo, zero config
- ✅ **PWA**: Service workers funcionam perfeitamente
- ✅ **Documentação**: Excelente e em português
- ✅ **DX**: Melhor experiência de desenvolvedor
- ✅ **Comunidade**: Muito ativa

**Configuração Vite**:
```javascript
// vite.config.js - já está otimizado!
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

---

## 2️⃣ NETLIFY

### 💰 Custo

**Plano Starter (Gratuito)**
- ✅ 100 GB bandwidth/mês
- ✅ 300 minutos de build/mês
- ✅ HTTPS automático
- ✅ Domínio .netlify.app

**Plano Pro ($19/mês)**
- 1 TB bandwidth
- 25.000 minutos de build
- Analytics
- Formulários ilimitados

**Estimativa para o projeto**: R$ 0/mês (Starter suficiente)

### 🚀 Facilidade de Deploy

**Pontuação: 9/10**

- ✅ Integração com GitHub/GitLab/Bitbucket
- ✅ Deploy automático
- ✅ Preview de branches
- ✅ CLI robusta (`netlify`)
- ⚡ Tempo de build: ~2-3 minutos
- ⚡ Tempo de deploy: ~45 segundos

**Configuração necessária**:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### ⚡ Performance

**Pontuação: 9/10**

- 🌍 **CDN Global**: Akamai CDN
- 📊 **Uptime**: 99.9% SLA
- ⚡ **TTFB**: ~100ms (média)
- 🚀 **Edge Functions**: Suporte via Deno
- 📦 **Compressão**: Gzip/Brotli

### 🎁 Recursos

| Recurso | Starter | Pro |
|---------|---------|-----|
| HTTPS Automático | ✅ | ✅ |
| Domínio Customizado | ✅ | ✅ |
| Variáveis de Ambiente | ✅ | ✅ |
| Preview Branches | ✅ | ✅ |
| Analytics | ❌ | ✅ |
| Formulários | 100/mês | ∞ |
| Split Testing | ❌ | ✅ |

### 📊 Limitações

**Plano Starter**:
- ⚠️ 100 GB bandwidth/mês
- ⚠️ 300 minutos de build/mês (~10 builds/dia)
- ⚠️ 100 formulários/mês
- ⚠️ Sem analytics nativo

**Para o projeto**: Limitação de build pode ser restritiva em desenvolvimento ativo

### ✅ Adequação ao Projeto

**Pontuação: 9/10**

- ✅ **Vite**: Suporte excelente
- ✅ **PWA**: Funciona bem
- ✅ **Documentação**: Muito boa
- ✅ **Redirects**: Configuração simples para SPA
- ⚠️ **Build minutes**: Pode limitar em dev ativo

---

## 3️⃣ CLOUDFLARE PAGES

### 💰 Custo

**Plano Free (Gratuito)**
- ✅ Bandwidth ilimitado
- ✅ Builds ilimitados
- ✅ 500 builds/mês
- ✅ HTTPS automático
- ✅ Domínio .pages.dev

**Plano Pro ($20/mês)**
- Builds simultâneos
- Rollbacks avançados
- Analytics detalhado

**Estimativa para o projeto**: R$ 0/mês (Free é excelente)

### 🚀 Facilidade de Deploy

**Pontuação: 8/10**

- ✅ Integração com GitHub/GitLab
- ✅ Deploy automático
- ✅ Preview de branches
- ✅ CLI Wrangler
- ⚡ Tempo de build: ~2-3 minutos
- ⚡ Tempo de deploy: ~1 minuto

**Configuração necessária**:
```bash
# Criar _redirects na pasta public
/* /index.html 200
```

### ⚡ Performance

**Pontuação: 10/10**

- 🌍 **CDN Global**: 300+ cidades (maior rede)
- 📊 **Uptime**: 99.99%+ (infraestrutura Cloudflare)
- ⚡ **TTFB**: <30ms (melhor da categoria)
- 🚀 **Workers**: Edge computing nativo
- 📦 **Compressão**: Brotli automático
- 🛡️ **DDoS**: Proteção incluída no free

**Destaque**: Melhor performance global

### 🎁 Recursos

| Recurso | Free | Pro |
|---------|------|-----|
| HTTPS Automático | ✅ | ✅ |
| Domínio Customizado | ✅ | ✅ |
| Variáveis de Ambiente | ✅ | ✅ |
| Preview Branches | ✅ | ✅ |
| Analytics | Básico | Avançado |
| Bandwidth | ∞ | ∞ |
| Proteção DDoS | ✅ | ✅ |

### 📊 Limitações

**Plano Free**:
- ⚠️ 500 builds/mês
- ⚠️ 1 build simultâneo
- ⚠️ 20.000 arquivos por deploy
- ⚠️ 25 MB por arquivo

**Para o projeto**: Sem limitações práticas

### ✅ Adequação ao Projeto

**Pontuação: 9/10**

- ✅ **Vite**: Suporte excelente
- ✅ **PWA**: Funciona perfeitamente
- ✅ **Performance**: Melhor CDN
- ✅ **Bandwidth ilimitado**: Grande vantagem
- ⚠️ **Interface**: Menos intuitiva que Vercel

---

## 4️⃣ GITHUB PAGES

### 💰 Custo

**Plano Free (Gratuito)**
- ✅ 100 GB bandwidth/mês
- ✅ 10 builds/hora
- ✅ HTTPS automático
- ✅ Domínio .github.io

**Estimativa para o projeto**: R$ 0/mês

### 🚀 Facilidade de Deploy

**Pontuação: 6/10**

- ✅ Integração nativa com GitHub
- ⚠️ Requer GitHub Actions
- ⚠️ Configuração manual necessária
- ⚡ Tempo de build: ~3-5 minutos
- ⚡ Tempo de deploy: ~2 minutos

**Configuração necessária**:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### ⚡ Performance

**Pontuação: 6/10**

- 🌍 **CDN**: Fastly CDN (limitado)
- 📊 **Uptime**: 99.9%
- ⚡ **TTFB**: ~200ms (mais lento)
- ❌ **Edge Functions**: Não suportado
- 📦 **Compressão**: Básica

### 🎁 Recursos

| Recurso | Free |
|---------|------|
| HTTPS Automático | ✅ |
| Domínio Customizado | ✅ |
| Variáveis de Ambiente | ⚠️ (via Actions) |
| Preview Branches | ❌ |
| Analytics | ❌ |

### 📊 Limitações

**Plano Free**:
- ⚠️ 100 GB bandwidth/mês
- ⚠️ 10 builds/hora
- ⚠️ 1 GB tamanho do site
- ⚠️ Sem preview de branches
- ⚠️ Configuração complexa

**Para o projeto**: Muitas limitações operacionais

### ✅ Adequação ao Projeto

**Pontuação: 5/10**

- ⚠️ **Vite**: Funciona, mas requer config
- ⚠️ **PWA**: Suporte limitado
- ❌ **DX**: Experiência inferior
- ❌ **Preview**: Não tem
- ✅ **Custo**: Totalmente gratuito

**Não recomendado** para este projeto

---

## 5️⃣ RAILWAY

### 💰 Custo

**Plano Trial (Gratuito)**
- ⚠️ $5 de crédito/mês
- ⚠️ Expira após uso
- ✅ HTTPS automático

**Plano Developer ($5/mês)**
- $5 de crédito incluído
- $0.000463/GB-hour

**Estimativa para o projeto**: ~$5-10/mês

### 🚀 Facilidade de Deploy

**Pontuação: 7/10**

- ✅ Integração com GitHub
- ✅ Deploy automático
- ⚠️ Mais voltado para backends
- ⚡ Tempo de build: ~2-3 minutos

**Configuração necessária**:
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist -s -p $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### ⚡ Performance

**Pontuação: 7/10**

- 🌍 **CDN**: Limitado
- 📊 **Uptime**: 99.9%
- ⚡ **TTFB**: ~150ms
- ⚠️ **Foco**: Backend/containers

### 🎁 Recursos

| Recurso | Trial | Developer |
|---------|-------|-----------|
| HTTPS Automático | ✅ | ✅ |
| Domínio Customizado | ✅ | ✅ |
| Variáveis de Ambiente | ✅ | ✅ |
| Preview Branches | ✅ | ✅ |
| Databases | ✅ | ✅ |

### 📊 Limitações

**Plano Trial**:
- ⚠️ $5 crédito/mês (pode acabar)
- ⚠️ Serviço pode pausar
- ⚠️ Não ideal para frontend estático

**Para o projeto**: Não é a melhor escolha

### ✅ Adequação ao Projeto

**Pontuação: 5/10**

- ⚠️ **Vite**: Funciona, mas não otimizado
- ⚠️ **Custo**: Não é gratuito de verdade
- ❌ **Foco**: Melhor para backends
- ❌ **CDN**: Limitado para frontend

**Não recomendado** - melhor para backends

---

## 6️⃣ RENDER

### 💰 Custo

**Plano Free (Gratuito)**
- ✅ 100 GB bandwidth/mês
- ✅ Builds ilimitados
- ✅ HTTPS automático
- ⚠️ Sites pausam após inatividade

**Plano Starter ($7/mês)**
- Sem pausa automática
- 100 GB bandwidth
- Suporte prioritário

**Estimativa para o projeto**: R$ 0/mês (com pausa) ou ~$7/mês

### 🚀 Facilidade de Deploy

**Pontuação: 8/10**

- ✅ Integração com GitHub/GitLab
- ✅ Deploy automático
- ✅ Interface intuitiva
- ⚡ Tempo de build: ~2-3 minutos
- ⚡ Tempo de deploy: ~1 minuto

**Configuração necessária**:
```yaml
# render.yaml
services:
  - type: web
    name: quermesse
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### ⚡ Performance

**Pontuação: 7/10**

- 🌍 **CDN**: Global CDN
- 📊 **Uptime**: 99.9%
- ⚡ **TTFB**: ~100ms
- ⚠️ **Cold start**: Sites pausam (free)

### 🎁 Recursos

| Recurso | Free | Starter |
|---------|------|---------|
| HTTPS Automático | ✅ | ✅ |
| Domínio Customizado | ✅ | ✅ |
| Variáveis de Ambiente | ✅ | ✅ |
| Preview Branches | ✅ | ✅ |
| Auto-pause | ✅ | ❌ |

### 📊 Limitações

**Plano Free**:
- ⚠️ 100 GB bandwidth/mês
- ⚠️ **Sites pausam após 15min inatividade**
- ⚠️ Cold start: ~30s para acordar
- ⚠️ 750 horas/mês de runtime

**Para o projeto**: Pausa automática é problemática para eventos

### ✅ Adequação ao Projeto

**Pontuação: 6/10**

- ✅ **Vite**: Suporte bom
- ✅ **Interface**: Muito boa
- ❌ **Auto-pause**: Crítico para eventos
- ⚠️ **Custo**: $7/mês para evitar pausa

**Não recomendado** - auto-pause é problemático

---

## 📊 TABELA COMPARATIVA GERAL

### Custos

| Plataforma | Plano Free | Bandwidth | Builds | Custo Real |
|------------|------------|-----------|--------|------------|
| **Vercel** | ✅ Hobby | 100 GB | Ilimitado | R$ 0 |
| **Netlify** | ✅ Starter | 100 GB | 300 min | R$ 0 |
| **Cloudflare** | ✅ Free | **Ilimitado** | 500/mês | R$ 0 |
| **GitHub Pages** | ✅ Free | 100 GB | 10/hora | R$ 0 |
| **Railway** | ⚠️ Trial | Variável | Ilimitado | ~$5-10 |
| **Render** | ⚠️ Free* | 100 GB | Ilimitado | R$ 0* |

*Render: Sites pausam após inatividade

### Recursos Técnicos

| Recurso | Vercel | Netlify | Cloudflare | GitHub | Railway | Render |
|---------|--------|---------|------------|--------|---------|--------|
| HTTPS Auto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CDN Global | ✅✅ | ✅ | ✅✅✅ | ⚠️ | ⚠️ | ✅ |
| Deploy Auto | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Preview PR | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Env Vars | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Analytics | ⚠️ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Edge Functions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Performance

| Métrica | Vercel | Netlify | Cloudflare | GitHub | Railway | Render |
|---------|--------|---------|------------|--------|---------|--------|
| TTFB | <50ms | ~100ms | **<30ms** | ~200ms | ~150ms | ~100ms |
| CDN Nodes | 100+ | 50+ | **300+** | 20+ | 10+ | 50+ |
| Uptime SLA | 99.99% | 99.9% | **99.99%** | 99.9% | 99.9% | 99.9% |
| Build Time | 1-2min | 2-3min | 2-3min | 3-5min | 2-3min | 2-3min |
| Deploy Time | 30s | 45s | 1min | 2min | 1min | 1min |

### Facilidade de Uso

| Aspecto | Vercel | Netlify | Cloudflare | GitHub | Railway | Render |
|---------|--------|---------|------------|--------|---------|--------|
| Setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Interface | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Docs | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| DX | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 ANÁLISE ESPECÍFICA PARA QUERMESSE

### Requisito: HTTPS para Câmera

**getUserMedia API** requer contexto seguro (HTTPS):

✅ **Todas as plataformas** fornecem HTTPS automático
✅ **Certificados SSL** gratuitos e auto-renovados
✅ **Domínios .app/.dev** também funcionam

**Veredito**: Todas atendem este requisito crítico

### Compatibilidade com Vite + React

| Plataforma | Vite Support | Config Needed | Score |
|------------|--------------|---------------|-------|
| **Vercel** | Nativo | Zero | 10/10 |
| **Netlify** | Excelente | Mínima | 9/10 |
| **Cloudflare** | Excelente | Mínima | 9/10 |
| **GitHub Pages** | Manual | Média | 6/10 |
| **Railway** | Funciona | Alta | 5/10 |
| **Render** | Bom | Baixa | 8/10 |

### PWA e Service Workers

Todas as plataformas suportam PWA, mas com diferenças:

✅ **Vercel**: Suporte perfeito, cache headers otimizados
✅ **Netlify**: Suporte completo, headers customizáveis
✅ **Cloudflare**: Excelente, Workers nativos
⚠️ **GitHub Pages**: Funciona, mas cache limitado
⚠️ **Railway**: Suporte básico
✅ **Render**: Suporte bom

### Volume: 50 Usuários Simultâneos

**Cálculo de bandwidth**:
- 50 usuários × 2 MB (app) = 100 MB por evento
- 1 evento/mês = ~100 MB/mês
- Margem de segurança: 500 MB/mês

**Todas as plataformas** suportam facilmente este volume

### Eventos Mensais

**Considerações**:
- ⚠️ **Render Free**: Site pode pausar entre eventos (cold start)
- ✅ **Outras**: Sempre disponíveis

**Recomendação**: Evitar Render Free para este caso

---

## 🏆 RECOMENDAÇÕES POR CASO DE USO

### 🥇 Melhor para TESTE/DESENVOLVIMENTO

**VERCEL** (Hobby Plan)

**Por quê?**
- ✅ Setup em 2 minutos
- ✅ Zero configuração
- ✅ Preview automático de PRs
- ✅ Melhor DX (Developer Experience)
- ✅ CLI poderosa
- ✅ Documentação excelente

**Como começar**:
```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar env vars
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 4. Deploy produção
vercel --prod
```

### 🥇 Melhor para PRODUÇÃO

**CLOUDFLARE PAGES** (Free Plan)

**Por quê?**
- ✅ **Bandwidth ilimitado** (crítico para crescimento)
- ✅ Melhor performance global (300+ CDN nodes)
- ✅ TTFB mais rápido (<30ms)
- ✅ Proteção DDoS incluída
- ✅ 500 builds/mês suficientes
- ✅ Totalmente gratuito

**Como começar**:
```bash
# 1. Conectar repositório no dashboard
# 2. Configurar build:
Build command: npm run build
Build output: dist

# 3. Adicionar env vars no dashboard
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# 4. Deploy automático!
```

### 🥇 Melhor para DISTRIBUIÇÃO FUTURA

**VERCEL** (Pro Plan - $20/mês)

**Por quê?**
- ✅ Analytics avançado
- ✅ Domínios ilimitados
- ✅ Proteção DDoS
- ✅ Suporte prioritário
- ✅ Logs de 30 dias
- ✅ Melhor para white-label

**Quando migrar**:
- Múltiplas quermesses
- Domínios customizados
- Necessidade de analytics
- Suporte profissional

### 🥈 Alternativa Sólida

**NETLIFY** (Starter Plan)

**Por quê?**
- ✅ Interface muito intuitiva
- ✅ Formulários incluídos
- ✅ Split testing
- ✅ Boa documentação
- ⚠️ Limitação de 300 min build

**Quando usar**:
- Preferência por interface Netlify
- Necessidade de formulários
- Testes A/B no futuro

---

## 📝 PASSO A PASSO: DEPLOY RECOMENDADO

### Opção 1: VERCEL (Mais Rápido)

#### 1. Preparar Projeto

```bash
# Garantir que build funciona localmente
npm run build
npm run preview

# Verificar .gitignore
echo "dist" >> .gitignore
echo ".env.local" >> .gitignore
```

#### 2. Deploy via Dashboard

1. Acessar [vercel.com](https://vercel.com)
2. Fazer login com GitHub
3. Clicar "Add New Project"
4. Importar repositório `quermesse`
5. Vercel detecta Vite automaticamente
6. Adicionar variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Clicar "Deploy"

**Tempo total**: ~3 minutos

#### 3. Deploy via CLI (Alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (primeira vez - modo interativo)
vercel

# Responder perguntas:
# - Set up and deploy? Yes
# - Which scope? Sua conta
# - Link to existing project? No
# - Project name? quermesse
# - Directory? ./
# - Override settings? No

# Adicionar variáveis de ambiente
vercel env add VITE_SUPABASE_URL production
# Cole o valor quando solicitado

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole o valor quando solicitado

# Deploy para produção
vercel --prod
```

#### 4. Configurar Domínio (Opcional)

```bash
# Via CLI
vercel domains add seudominio.com

# Ou via dashboard:
# Project Settings > Domains > Add Domain
```

#### 5. Configurar Deploy Automático

Já está configurado! Cada push para `main` faz deploy automático.

**Preview de PRs**: Automático para cada Pull Request

### Opção 2: CLOUDFLARE PAGES (Melhor Performance)

#### 1. Preparar Projeto

```bash
# Criar arquivo de redirects para SPA
mkdir -p public
echo "/* /index.html 200" > public/_redirects

# Commit
git add public/_redirects
git commit -m "Add Cloudflare redirects"
git push
```

#### 2. Deploy via Dashboard

1. Acessar [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages > Create application > Pages
3. Connect to Git > Selecionar repositório
4. Configurar build:
   ```
   Build command: npm run build
   Build output directory: dist
   ```
5. Adicionar variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Save and Deploy

**Tempo total**: ~5 minutos

#### 3. Verificar Deploy

```bash
# URL será algo como:
# https://quermesse.pages.dev

# Testar HTTPS e câmera
# Abrir no mobile e testar QR scanner
```

#### 4. Configurar Domínio Customizado (Opcional)

1. Pages > Custom domains
2. Add custom domain
3. Seguir instruções DNS

---

## 🔍 CONSIDERAÇÕES ESPECIAIS

### 1. HTTPS e Câmera (getUserMedia)

**Requisitos da API**:
```javascript
// Funciona apenas em contexto seguro
navigator.mediaDevices.getUserMedia({ video: true })
```

**Contextos seguros**:
- ✅ `https://` (todas as plataformas fornecem)
- ✅ `localhost` (desenvolvimento)
- ❌ `http://` (não funciona em produção)

**Teste de compatibilidade**:
```javascript
// Adicionar no console do browser
if (window.isSecureContext) {
  console.log('✅ Contexto seguro - câmera funcionará');
} else {
  console.log('❌ Contexto inseguro - câmera NÃO funcionará');
}
```

### 2. Supabase na Nuvem

**Vantagens**:
- ✅ Backend já está hospedado
- ✅ Sem necessidade de servidor próprio
- ✅ CORS já configurado
- ✅ SSL/TLS nativo

**Configuração**:
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**Variáveis de ambiente** devem ser configuradas na plataforma de hospedagem.

### 3. Domínio Próprio (Futuro)

**Quando considerar**:
- Múltiplas quermesses usando o sistema
- Branding profissional
- SEO importante
- Email customizado

**Custos**:
- Domínio `.com.br`: ~R$ 40/ano
- Domínio `.com`: ~R$ 60/ano
- Configuração: Gratuita em todas as plataformas

**Processo**:
1. Comprar domínio (Registro.br, Namecheap, etc)
2. Adicionar domínio na plataforma
3. Configurar DNS (A/CNAME records)
4. Aguardar propagação (até 48h)

### 4. Facilidade para Não-Técnicos

**Vercel**:
- ✅ Interface muito intuitiva
- ✅ Deploy com 1 clique
- ✅ Logs claros
- ⚠️ Requer conhecimento de Git

**Cloudflare**:
- ⚠️ Interface mais técnica
- ✅ Deploy automático
- ⚠️ Logs mais complexos

**Recomendação**: Vercel para gestão por não-técnicos

### 5. PWA e Cache

**Service Worker**:
```javascript
// vite.config.js - adicionar plugin PWA
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Sistema Quermesse',
        short_name: 'Quermesse',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

**Cache Headers** (automático em Vercel/Cloudflare):
```
Cache-Control: public, max-age=31536000, immutable
```

### 6. Monitoramento e Analytics

**Opções gratuitas**:
- Google Analytics 4
- Vercel Analytics (básico no free)
- Cloudflare Web Analytics
- Plausible (self-hosted)

**Métricas importantes**:
- Pageviews por evento
- Tempo de carregamento
- Erros JavaScript
- Uso de câmera

---

## 📊 MATRIZ DE DECISÃO

### Cenário 1: Teste Rápido (1 semana)

**Escolha**: VERCEL
- Setup: 2 minutos
- Deploy: Automático
- Custo: R$ 0

### Cenário 2: Produção (1 quermesse)

**Escolha**: CLOUDFLARE PAGES
- Performance: Melhor
- Bandwidth: Ilimitado
- Custo: R$ 0

### Cenário 3: Múltiplas Quermesses

**Escolha**: VERCEL PRO
- Domínios: Ilimitados
- Analytics: Incluído
- Custo: $20/mês (~R$ 100)

### Cenário 4: Orçamento Zero Absoluto

**Escolha**: CLOUDFLARE PAGES
- Sem limitações práticas
- Performance excelente
- Custo: R$ 0 para sempre

---

## ✅ RECOMENDAÇÃO FINAL

### Para o Seu Caso Específico

**Perfil**:
- Volume baixo (50 usuários)
- Eventos mensais
- Orçamento zero
- Domínio da plataforma

### 🏆 RECOMENDAÇÃO: VERCEL (Hobby)

**Justificativa**:

1. **Setup Instantâneo** (2 minutos)
   - Zero configuração
   - Deploy automático
   - Preview de PRs

2. **Developer Experience**
   - Melhor DX do mercado
   - CLI poderosa
   - Documentação excelente

3. **Adequação Perfeita**
   - 100 GB bandwidth > suficiente
   - Builds ilimitados
   - HTTPS automático
   - Vite nativo

4. **Crescimento Futuro**
   - Fácil upgrade para Pro
   - Domínios customizados
   - Analytics disponível

5. **Confiabilidade**
   - 99.99% uptime
   - CDN global
   - Sem cold starts

### 🥈 Alternativa: CLOUDFLARE PAGES

**Quando usar**:
- Preocupação com bandwidth futuro
- Melhor performance é prioridade
- Já usa Cloudflare para DNS

**Vantagens**:
- Bandwidth ilimitado
- Melhor TTFB
- Proteção DDoS incluída

---

## 🚀 PRÓXIMOS PASSOS

### Imediato (Hoje)

1. ✅ Criar conta na Vercel
2. ✅ Conectar repositório GitHub
3. ✅ Configurar variáveis de ambiente
4. ✅ Fazer primeiro deploy
5. ✅ Testar câmera no mobile

### Curto Prazo (Esta Semana)

1. ✅ Testar em diferentes dispositivos
2. ✅ Configurar domínio .vercel.app customizado
3. ✅ Adicionar Google Analytics
4. ✅ Documentar URL para equipe
5. ✅ Fazer backup das env vars

### Médio Prazo (Próximo Mês)

1. ⏳ Monitorar uso de bandwidth
2. ⏳ Avaliar necessidade de domínio próprio
3. ⏳ Considerar PWA completo
4. ⏳ Implementar analytics de eventos
5. ⏳ Avaliar upgrade para Pro (se necessário)

### Longo Prazo (3-6 Meses)

1. 📅 Avaliar migração para Cloudflare (se bandwidth crescer)
2. 📅 Considerar domínio próprio
3. 📅 Implementar multi-tenancy (múltiplas quermesses)
4. 📅 Avaliar Vercel Pro para white-label
5. 📅 Implementar monitoramento avançado

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

### Tutoriais Recomendados

- [Deploy Vite to Vercel](https://vercel.com/guides/deploying-vite-to-vercel)
- [Vite + React + Vercel](https://www.youtube.com/watch?v=...)
- [PWA with Vite](https://vite-pwa-org.netlify.app/)

### Ferramentas de Teste

- [WebPageTest](https://www.webpagetest.org) - Performance
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA/Performance
- [SSL Labs](https://www.ssllabs.com/ssltest/) - HTTPS
- [Can I Use](https://caniuse.com/?search=getUserMedia) - Compatibilidade

---

## 🎯 CONCLUSÃO

Para o sistema de quermesse com os requisitos especificados:

✅ **VERCEL (Hobby)** é a melhor escolha para começar
✅ **CLOUDFLARE PAGES** é excelente alternativa para produção
✅ Todas as opções atendem o requisito crítico de HTTPS
✅ Custo zero é totalmente viável
✅ Migração futura é simples se necessário

**Ação Recomendada**: Deploy imediato na Vercel para validar o sistema em produção.

---

**Documento criado em**: 19/06/2026  
**Versão**: 1.0  
**Autor**: Bob (Planning Mode)  
**Próxima revisão**: Após primeiro evento em produção