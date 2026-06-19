# Fluxo de Cartões Pré-Impressos - Documentação Completa

## 📋 Visão Geral

Sistema completo para gerenciar cartões pré-impressos em quermesses, permitindo:
- Geração de lotes de cartões para impressão
- Vinculação de cartões a clientes no caixa
- Transferência de saldo entre cartões (substituição)

---

## 🎯 Fluxos Implementados

### 1. ADMIN - Geração de Lote

**Página:** `/admin/generate-batch`

**Fluxo:**
1. Admin acessa página de geração de lotes
2. Define quantidade de cartões (ex: 100, 200, 500)
3. Adiciona descrição do lote (opcional)
4. Sistema gera lote com código único (ex: `BATCH-20240619-001`)
5. Sistema cria cartões com status `pending` (não vinculados)
6. Admin exporta lote em CSV ou JSON
7. Admin imprime QR Codes dos cartões

**Arquivos:**
- `src/pages/admin/GenerateBatch.jsx`
- `src/hooks/useBatch.js`

**Banco de Dados:**
```sql
-- Lote criado
INSERT INTO card_batches (batch_code, quantity, description, status)
VALUES ('BATCH-20240619-001', 100, 'Lote para evento', 'active');

-- Cartões criados
INSERT INTO cards (batch_id, is_pre_generated, status, balance)
VALUES (1, true, 'pending', 0);
```

---

### 2. CAIXA - Vincular Cartão a Cliente

**Página:** `/caixa/novo-cliente`

**Fluxo:**
1. Cliente chega no caixa sem cartão
2. Caixa acessa "Novo Cliente"
3. Caixa escaneia QR Code de um cartão pré-impresso
4. Sistema verifica se cartão está disponível (status `pending`)
5. Sistema pede: Nome + Telefone do cliente
6. Sistema verifica se cliente já existe (por telefone)
   - Se existe: usa cliente existente
   - Se não existe: cria novo cliente
7. Sistema vincula cartão ao cliente
8. Sistema ativa cartão (status `pending` → `active`)
9. Caixa entrega cartão físico ao cliente

**Validações:**
- Cartão deve estar no status `pending`
- Cartão não pode estar vinculado a outro cliente
- Nome obrigatório (mínimo 3 caracteres)
- Telefone opcional (formato: `(11) 98765-4321`)
- Telefone único por cliente

**Arquivos:**
- `src/pages/caixa/NovoCliente.jsx`
- `src/hooks/useCardBinding.js`

**Stored Procedure:**
```sql
SELECT * FROM bind_card_to_client(
  p_card_uuid := 'uuid-do-cartao',
  p_client_name := 'João da Silva',
  p_client_phone := '(11) 98765-4321'
);
```

**Resultado:**
```sql
-- Cliente criado/encontrado
INSERT INTO clients (name, phone) VALUES ('João da Silva', '(11) 98765-4321');

-- Cartão vinculado e ativado
UPDATE cards 
SET client_id = 1, 
    status = 'active', 
    activated_at = NOW()
WHERE uuid = 'uuid-do-cartao';
```

---

### 3. CAIXA - Transferir Cartão (Substituição)

**Página:** `/caixa/transferir-cartao`

**Fluxo:**
1. Cliente chega com cartão desgastado/danificado
2. Caixa acessa "Transferir Cartão"
3. Caixa escaneia cartão antigo (origem)
4. Sistema valida cartão antigo:
   - Deve estar ativo
   - Deve estar vinculado a um cliente
5. Caixa escaneia cartão novo (destino - do lote)
6. Sistema valida cartão novo:
   - Deve estar disponível (status `pending`)
   - Não pode estar vinculado
7. Sistema mostra confirmação com:
   - Dados do cliente
   - Saldo a ser transferido
   - Cartão antigo → Cartão novo
8. Caixa confirma transferência
9. Sistema executa transferência:
   - Transfere saldo do cartão antigo para o novo
   - Vincula cartão novo ao mesmo cliente
   - Ativa cartão novo
   - Desativa cartão antigo
   - Registra transações de saída e entrada
10. Caixa entrega novo cartão ao cliente
11. Caixa recolhe cartão antigo

**Validações:**
- Cartão antigo deve estar ativo
- Cartão antigo deve ter cliente vinculado
- Cartão novo deve estar disponível (status `pending`)
- Cartão novo não pode estar vinculado
- Não pode transferir para o mesmo cartão

**Arquivos:**
- `src/pages/caixa/TransferirCartao.jsx`
- `src/hooks/useCardBinding.js`

**Stored Procedure:**
```sql
SELECT * FROM transfer_card_balance(
  p_idempotency_key := 'uuid-unico',
  p_old_card_uuid := 'uuid-cartao-antigo',
  p_new_card_uuid := 'uuid-cartao-novo',
  p_description := 'Transferência por substituição de cartão'
);
```

**Resultado:**
```sql
-- Desativa cartão antigo e zera saldo
UPDATE cards 
SET balance = 0, 
    status = 'inactive'
WHERE uuid = 'uuid-cartao-antigo';

-- Ativa cartão novo e transfere saldo
UPDATE cards 
SET balance = 50.00, 
    client_id = 1, 
    status = 'active',
    activated_at = NOW()
WHERE uuid = 'uuid-cartao-novo';

-- Registra transação de saída
INSERT INTO transactions (card_id, type, amount, balance_after, description)
VALUES (1, 'transfer_out', 50.00, 0, 'Transferência por substituição');

-- Registra transação de entrada
INSERT INTO transactions (card_id, type, amount, balance_after, description)
VALUES (2, 'transfer_in', 50.00, 50.00, 'Transferência por substituição');
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `card_batches`
```sql
CREATE TABLE card_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL,
    generated_by VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `cards`
```sql
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    client_id BIGINT REFERENCES clients(id),
    batch_id BIGINT REFERENCES card_batches(id),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    is_pre_generated BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Status do Cartão:**
- `pending`: Pré-gerado, aguardando vinculação
- `active`: Ativo e vinculado a cliente
- `inactive`: Desativado (substituído ou cancelado)
- `blocked`: Bloqueado por segurança

### Tabela: `clients`
```sql
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Stored Procedures

### 1. `bind_card_to_client`

Vincula um cartão pré-gerado a um cliente.

**Parâmetros:**
- `p_card_uuid`: UUID do cartão
- `p_client_name`: Nome do cliente
- `p_client_phone`: Telefone do cliente (opcional)

**Retorno:**
- `card_id`: ID do cartão vinculado
- `client_id`: ID do cliente
- `success`: Boolean indicando sucesso
- `message`: Mensagem de retorno

**Lógica:**
1. Valida nome (mínimo 3 caracteres)
2. Valida telefone (formato brasileiro)
3. Busca cartão e bloqueia (FOR UPDATE)
4. Valida se cartão está disponível (status `pending`)
5. Verifica se cliente já existe (por telefone)
6. Cria cliente se não existir
7. Vincula cartão ao cliente
8. Ativa cartão (status → `active`)
9. Define `activated_at`

### 2. `transfer_card_balance`

Transfere saldo de um cartão antigo para um novo.

**Parâmetros:**
- `p_idempotency_key`: UUID único para idempotência
- `p_old_card_uuid`: UUID do cartão antigo
- `p_new_card_uuid`: UUID do cartão novo
- `p_description`: Descrição da transferência

**Retorno:**
- `old_card_id`: ID do cartão antigo
- `new_card_id`: ID do cartão novo
- `transferred_amount`: Valor transferido
- `success`: Boolean indicando sucesso
- `message`: Mensagem de retorno

**Lógica:**
1. Verifica idempotência (evita duplicação)
2. Busca e bloqueia ambos os cartões (FOR UPDATE)
3. Valida cartão antigo (ativo e vinculado)
4. Valida cartão novo (disponível e não vinculado)
5. Valida que não são o mesmo cartão
6. Se saldo = 0: apenas vincula novo cartão
7. Se saldo > 0:
   - Zera saldo do cartão antigo
   - Transfere saldo para cartão novo
   - Vincula cartão novo ao mesmo cliente
   - Ativa cartão novo
   - Desativa cartão antigo
   - Registra transações (saída e entrada)

---

## 📱 Componentes React

### Hook: `useCardBinding`

**Localização:** `src/hooks/useCardBinding.js`

**Funções:**
- `checkCardAvailability(cardUuid)`: Verifica se cartão está disponível
- `bindCardToClient(cardUuid, name, phone)`: Vincula cartão a cliente
- `transferCardBalance(oldUuid, newUuid)`: Transfere saldo entre cartões
- `getAvailableCardsFromBatch(batchId)`: Lista cartões disponíveis de um lote
- `getAllAvailableCards(limit)`: Lista todos cartões disponíveis
- `getCardByUuid(cardUuid)`: Busca cartão por UUID

### Página: `NovoCliente`

**Localização:** `src/pages/caixa/NovoCliente.jsx`

**Estados:**
- `step`: Controla fluxo (scan → form → success)
- `scannedCard`: Cartão escaneado
- `formData`: Dados do formulário (name, phone)
- `boundCard`: Cartão vinculado (resultado)

**Componentes:**
- Scanner de QR Code
- Formulário de cliente
- Tela de sucesso

### Página: `TransferirCartao`

**Localização:** `src/pages/caixa/TransferirCartao.jsx`

**Estados:**
- `step`: Controla fluxo (scan-old → scan-new → confirm → success)
- `oldCard`: Cartão antigo
- `newCard`: Cartão novo
- `transferResult`: Resultado da transferência

**Componentes:**
- Scanner de QR Code (modo duplo)
- Tela de confirmação
- Tela de sucesso

---

## 🔐 Segurança e Validações

### Validações de Cartão

1. **Disponibilidade:**
   - Status deve ser `pending`
   - Não pode estar vinculado a cliente
   - Deve ser pré-gerado (`is_pre_generated = true`)

2. **Ativação:**
   - Só pode ativar cartões disponíveis
   - Cliente deve ser válido
   - Telefone único (se fornecido)

3. **Transferência:**
   - Cartão origem deve estar ativo
   - Cartão origem deve ter cliente
   - Cartão destino deve estar disponível
   - Não pode transferir para mesmo cartão

### Validações de Cliente

1. **Nome:**
   - Obrigatório
   - Mínimo 3 caracteres
   - Não pode ser vazio

2. **Telefone:**
   - Opcional
   - Formato: `(11) 98765-4321`
   - Único por cliente

### Idempotência

Todas as operações críticas usam chave de idempotência:
- Evita duplicação de transações
- Permite retry seguro
- Registrado em `transactions.metadata`

### Concorrência

Uso de `FOR UPDATE` para evitar race conditions:
- Bloqueia cartões durante operações
- Ordem crescente de IDs (evita deadlock)
- Transações atômicas

---

## 🚀 Como Usar

### 1. Preparação (Admin)

```bash
# 1. Acessar geração de lotes
http://localhost:5173/admin/generate-batch

# 2. Gerar lote de 100 cartões
Quantidade: 100
Descrição: "Lote para evento de junho"

# 3. Exportar e imprimir
- Baixar CSV ou JSON
- Imprimir QR Codes dos cartões
- Distribuir cartões físicos
```

### 2. Vinculação (Caixa)

```bash
# 1. Acessar vinculação
http://localhost:5173/caixa/novo-cliente

# 2. Escanear cartão pré-impresso
- Posicionar QR Code na câmera
- Sistema valida disponibilidade

# 3. Preencher dados do cliente
Nome: "João da Silva"
Telefone: "(11) 98765-4321" (opcional)

# 4. Confirmar vinculação
- Sistema vincula cartão
- Sistema ativa cartão
- Entregar cartão ao cliente
```

### 3. Transferência (Caixa)

```bash
# 1. Acessar transferência
http://localhost:5173/caixa/transferir-cartao

# 2. Escanear cartão antigo
- Cliente apresenta cartão desgastado
- Sistema valida cartão e cliente

# 3. Escanear cartão novo
- Pegar cartão novo do lote
- Sistema valida disponibilidade

# 4. Confirmar transferência
- Revisar informações
- Confirmar operação
- Sistema transfere saldo automaticamente

# 5. Finalizar
- Entregar novo cartão ao cliente
- Recolher cartão antigo
```

---

## 📊 Relatórios e Consultas

### Cartões Disponíveis

```sql
SELECT 
    c.uuid,
    c.created_at,
    b.batch_code,
    b.description
FROM cards c
JOIN card_batches b ON c.batch_id = b.id
WHERE c.status = 'pending'
  AND c.client_id IS NULL
  AND c.is_pre_generated = true
ORDER BY c.created_at DESC;
```

### Cartões Vinculados

```sql
SELECT 
    c.uuid,
    c.balance,
    c.activated_at,
    cl.name as client_name,
    cl.phone as client_phone,
    b.batch_code
FROM cards c
JOIN clients cl ON c.client_id = cl.id
LEFT JOIN card_batches b ON c.batch_id = b.id
WHERE c.status = 'active'
  AND c.is_pre_generated = true
ORDER BY c.activated_at DESC;
```

### Transferências Realizadas

```sql
SELECT 
    t1.created_at,
    c1.uuid as old_card,
    c2.uuid as new_card,
    t1.amount,
    cl.name as client_name
FROM transactions t1
JOIN transactions t2 ON t1.metadata->>'idempotency_key' = t2.metadata->>'idempotency_key'
JOIN cards c1 ON t1.card_id = c1.id
JOIN cards c2 ON t2.card_id = c2.id
JOIN clients cl ON c2.client_id = cl.id
WHERE t1.type = 'transfer_out'
  AND t2.type = 'transfer_in'
  AND t1.metadata->>'transfer_type' = 'card_replacement'
ORDER BY t1.created_at DESC;
```

---

## 🐛 Troubleshooting

### Erro: "Cartão não está disponível"

**Causa:** Cartão já vinculado ou status incorreto

**Solução:**
```sql
-- Verificar status do cartão
SELECT uuid, status, client_id, is_pre_generated
FROM cards
WHERE uuid = 'uuid-do-cartao';

-- Se necessário, liberar cartão (cuidado!)
UPDATE cards
SET status = 'pending', client_id = NULL
WHERE uuid = 'uuid-do-cartao';
```

### Erro: "Telefone inválido"

**Causa:** Formato incorreto

**Solução:** Use formato `(11) 98765-4321`
- 2 dígitos DDD entre parênteses
- Espaço
- 4 ou 5 dígitos
- Hífen
- 4 dígitos

### Erro: "Cartão já está vinculado"

**Causa:** Tentativa de vincular cartão ativo

**Solução:**
1. Verificar se é realmente o cartão correto
2. Se for substituição, usar fluxo de transferência
3. Se for erro, contatar admin para liberar

---

## 📝 Notas Importantes

1. **Cartões pré-gerados são permanentes:** Uma vez criados, não podem ser deletados, apenas desativados

2. **Telefone é chave única:** Se cliente já existe com mesmo telefone, sistema reutiliza cliente

3. **Transferências são irreversíveis:** Após transferir, cartão antigo é desativado permanentemente

4. **QR Codes devem ser únicos:** Cada cartão tem UUID único, não reutilizar QR Codes

5. **Backup regular:** Fazer backup do banco antes de operações em massa

---

## 🔄 Próximas Melhorias

- [ ] Relatório de cartões por lote
- [ ] Histórico de vinculações
- [ ] Busca de cartões disponíveis por lote
- [ ] Impressão de QR Codes direto do sistema
- [ ] Notificação de cartões próximos ao fim
- [ ] Dashboard de estatísticas de lotes

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Consultar esta documentação
3. Verificar stored procedures no banco
4. Contatar desenvolvedor

---

**Documentação criada em:** 19/06/2024  
**Versão:** 1.0  
**Autor:** Bob (AI Assistant)
