# Restrição de Barraca Fixa para Operadores de Barraca

## Requisito de negócio

Operadores com perfil `barraca` devem realizar cobranças apenas na barraca à qual estão vinculados no cadastro do usuário.

### Regras esperadas

- O operador `barraca` não pode escolher outra barraca manualmente.
- A cobrança deve usar automaticamente `profile.barraca_id`.
- O nome da barraca deve aparecer na interface como informação fixa.
- Se o usuário `barraca` não possuir `barraca_id`, a cobrança deve ser bloqueada.
- Qualquer tentativa de cobrar usando outra barraca deve falhar.

---

## Implementação técnica

### Arquivo principal de cobrança/venda

Arquivo ajustado:

- `src/pages/Sale.jsx`

Como foi implementado:

1. A tela passou a usar `useAuth()` para acessar:
   - `profile`
   - `isBarraca`

2. Para usuários com perfil `barraca`:
   - a barraca é definida automaticamente a partir de `profile.barraca_id`
   - o fluxo avança para leitura do cartão apenas quando a barraca vinculada é encontrada
   - o seletor editável de barraca não é exibido

3. Para usuários que não são `barraca`:
   - a seleção manual de barraca continua disponível

4. A interface passou a mostrar claramente a barraca em operação:
   - na etapa de leitura do cartão
   - na etapa de adição de produtos

5. Antes de avançar para confirmação e antes de processar a venda, a tela valida:
   - existência de `selectedBarraca.id`
   - compatibilidade entre `profile.barraca_id` e a barraca usada, quando o perfil é `barraca`

---

## Validações de segurança

### Hook de transações

Arquivo ajustado:

- `src/hooks/useTransactions.js`

Validações adicionadas:

#### 1. Restrição em consultas de transações

No `fetchTransactions`:

- se o usuário for `barraca`, o filtro `barraca_id` é forçado para `profile.barraca_id`
- se houver tentativa de consultar outra barraca, a operação falha
- se o usuário `barraca` não tiver barraca vinculada, a operação falha

#### 2. Restrição no processamento da venda

No `processSale`:

- se o usuário for `barraca`, a barraca efetiva usada na RPC é sempre a barraca vinculada ao perfil
- se for informado `barraca_id` diferente da barraca do operador, a operação falha
- se não existir barraca válida, a venda falha
- se não existir `card_id`, a venda falha
- se não houver itens, a venda falha

### Resultado prático

Mesmo que alguém tente manipular a interface e enviar outro `barraca_id`, o hook impede o uso indevido e força a barraca correta para operadores `barraca`.

---

## Comportamento da interface

### Operador com perfil `barraca`

- não vê select de barraca
- vê a barraca vinculada como texto fixo
- só consegue operar na própria barraca
- recebe erro claro se não houver barraca vinculada

### Perfis administrativos

- continuam podendo selecionar barraca manualmente na tela de venda

---

## Arquivos impactados

- `src/pages/Sale.jsx`
- `src/hooks/useTransactions.js`

Observação:

- o arquivo citado no requisito, `src/pages/barraca/Cobrar.jsx`, não existe no projeto atual
- a tela efetiva de cobrança/venda encontrada e ajustada foi `src/pages/Sale.jsx`

---

## Testes realizados

### Validações funcionais implementadas

1. **Operador `barraca` sem barraca vinculada**
   - resultado esperado: bloqueio da cobrança
   - implementação: alerta na etapa inicial e falha nas validações

2. **Operador `barraca` com barraca vinculada**
   - resultado esperado: barraca carregada automaticamente
   - implementação: seleção automática via `profile.barraca_id`

3. **Operador `barraca` tentando usar outra barraca**
   - resultado esperado: falha
   - implementação:
     - bloqueio na tela
     - bloqueio no `processSale`
     - bloqueio no `fetchTransactions`

4. **Exibição da barraca na interface**
   - resultado esperado: nome da barraca visível e fixo
   - implementação: cards informativos com a barraca em operação

5. **Perfis não `barraca`**
   - resultado esperado: continuam podendo selecionar barraca
   - implementação: select mantido apenas para esses perfis

---

## Observações finais

A solução foi implementada em duas camadas:

1. **Interface**
   - remove a possibilidade de escolha manual para operador `barraca`

2. **Regra de segurança no hook**
   - impede uso indevido mesmo em caso de tentativa de manipulação do frontend

Essa abordagem reduz risco operacional e mantém o comportamento esperado para perfis administrativos.