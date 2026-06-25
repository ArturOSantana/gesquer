# Venditor

Plataforma SaaS para gestão de eventos com carteira digital via QR Code, controle de vendas, estoque, operadores e relatórios em tempo real.

O **Venditor** nasceu para resolver problemas comuns em eventos: filas, controle manual de fichas, falta de rastreabilidade e dificuldade de gestão financeira.

Inicialmente pensado para quermesses, o sistema evoluiu para atender qualquer tipo de evento, seja recorrente ou pontual.

---

# Visão Geral

O Venditor permite que organizadores realizem a gestão completa de eventos utilizando cartões com QR Code e saldo pré-pago.

O participante carrega créditos em um cartão e utiliza esse saldo para realizar compras em qualquer ponto de venda do evento.

Todo o processo é registrado em tempo real.

---

# Casos de Uso

O Venditor pode ser utilizado em:

* Quermesses
* Festas paroquiais
* Novenas
* Cantinas semanais
* Festivais
* Shows
* Eventos corporativos
* Congressos
* Feiras culturais
* Festas escolares
* Food Parks
* Eventos beneficentes

---

# Funcionalidades

## Carteira Digital via QR Code

Cada participante recebe um cartão com QR Code único.

Funcionalidades:

* Cadastro de participantes
* Emissão de cartões
* Recarga de saldo
* Consulta de saldo
* Histórico de movimentações
* Transferência para novo cartão
* Bloqueio de cartões perdidos ou danificados

---

## Vendas

Os operadores realizam vendas diretamente pelo navegador do celular.

Fluxo:

```text
Selecionar produtos
↓
Calcular total
↓
Escanear QR Code
↓
Validar saldo
↓
Confirmar venda
↓
Atualizar estoque
↓
Registrar transação
```

---

## Controle de Estoque

Cada evento possui seus próprios produtos e pontos de venda.

Funcionalidades:

* Cadastro de produtos
* Estoque inicial
* Entrada de estoque
* Baixa automática por venda
* Estoque mínimo
* Alertas de reposição

---

## Dashboard

Acompanhamento em tempo real da operação.

Indicadores:

* Total arrecadado
* Vendas por ponto de venda
* Produtos mais vendidos
* Estoque crítico
* Saldo em circulação
* Histórico de transações
* Ranking de vendas

---

## Histórico e Auditoria

Todas as operações são registradas.

Exemplos:

* Recargas
* Vendas
* Transferências
* Estornos
* Alterações de estoque
* Logins
* Ações administrativas

---

# Arquitetura

## Estrutura Multi-Organização

```text
Venditor
│
├── Organização
│   ├── Usuários
│   ├── Clientes
│   ├── Cartões
│   └── Eventos
│
└── Organização
    ├── Usuários
    ├── Clientes
    ├── Cartões
    └── Eventos
```

---

## Estrutura de Evento

```text
Evento
│
├── Pontos de Venda
├── Produtos
├── Estoque
├── Operadores
├── Vendas
└── Transações
```

---

# Hierarquia de Usuários

## SuperAdmin

Responsável pela plataforma.

Permissões:

* Gerenciar organizações
* Criar administradores
* Visualizar métricas globais
* Configurar o sistema
* Prestar suporte

---

## Admin

Responsável pela organização.

Permissões:

* Criar eventos
* Gerenciar produtos
* Gerenciar estoque
* Criar usuários
* Visualizar relatórios
* Monitorar vendas

---

## Caixa

Responsável pela gestão dos cartões.

Permissões:

* Cadastrar participantes
* Emitir cartões
* Recarregar saldo
* Transferir cartões
* Consultar movimentações

---

## Operador

Responsável pelas vendas.

Permissões:

* Registrar vendas
* Consultar saldo
* Visualizar histórico operacional

---

# Fluxo de Operação

## Configuração Inicial

```text
SuperAdmin
    ↓
Cria Organização
    ↓
Cria Admin
    ↓
Admin cria Evento
    ↓
Admin cria Operadores
    ↓
Evento pronto para operação
```

---

## Operação do Evento

```text
Participante chega
    ↓
Caixa emite cartão
    ↓
Caixa adiciona saldo
    ↓
Participante realiza compras
    ↓
Operador escaneia QR Code
    ↓
Saldo é debitado
    ↓
Venda registrada
```

---

# Estrutura do Banco de Dados

## organizations

Representa a instituição proprietária da operação.

Exemplos:

* Paróquia
* Escola
* Empresa
* Associação

---

## events

Representa cada evento criado pela organização.

Exemplos:

* Quermesse 2027
* Festa Junina
* Novena de Maio
* Café dos Jovens

---

## users

Usuários da plataforma.

Perfis:

```text
SUPERADMIN
ADMIN
CAIXA
OPERADOR
```

---

## customers

Participantes cadastrados.

Campos principais:

```text
id
nome
telefone
ativo
```

---

## cards

Cartões utilizados pelos participantes.

Campos principais:

```text
id
customer_id
saldo
qr_code
status
```

---

## points_of_sale

Pontos de venda do evento.

Exemplos:

* Pastel
* Refrigerante
* Doces
* Rifa
* Camisetas

---

## products

Produtos vendidos em cada ponto de venda.

---

## sales

Registro das vendas realizadas.

---

## transactions

Registro financeiro completo.

Tipos:

* Recarga
* Venda
* Transferência
* Estorno
* Ajuste

---

# Stack Tecnológica

## Frontend

* React 18
* Vite
* Tailwind CSS
* PWA
* React Router
* Zustand
* html5-qrcode
* qrcode

---

## Backend

* Supabase
* PostgreSQL
* Row Level Security (RLS)
* JWT Authentication

---

## Infraestrutura

* Vercel
* Supabase Cloud

---

# Segurança

## Autenticação

* JWT
* Refresh Tokens
* Controle por perfil

## Banco de Dados

* PostgreSQL
* Transações ACID
* Validação atômica de saldo

## Proteções

* HTTPS
* RLS
* Logs de auditoria
* Idempotência de transações
* Proteção contra cobranças duplicadas

---

# Progressive Web App (PWA)

O Venditor funciona diretamente no navegador e pode ser instalado no celular.

Recursos:

* Instalação sem lojas de aplicativos
* Cache inteligente
* Inicialização rápida
* Interface otimizada para dispositivos móveis

---

# Escalabilidade

## Plano Gratuito

Indicado para:

* Até 1.000 participantes por evento
* Até 20 operadores simultâneos
* Pequenos e médios eventos

---

## Plano Profissional

Indicado para:

* Múltiplos eventos simultâneos
* Milhares de participantes
* Operação contínua durante todo o ano

---

# Roadmap

## Versão 1.0

* Carteira digital
* QR Code
* Vendas
* Estoque
* Dashboard
* Histórico

## Versão 2.0

* Exportação Excel
* Relatórios avançados
* Impressão em lote de cartões
* Dashboard financeiro avançado

## Versão 3.0

* Integração PIX
* Notificações
* Aplicativo mobile
* Multi-admin por evento


---

# Missão

Oferecer uma plataforma simples, rápida e segura para gestão de eventos, eliminando fichas físicas, reduzindo filas e proporcionando controle total sobre vendas, estoque e movimentações financeiras.

## Venditor

Gestão inteligente para eventos.
