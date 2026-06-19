# Correção: Erro de Coluna `nome` vs `name`

## Problema Identificado

**Erro:** `column barracas_1.nome does not exist`  
**Hint:** Perhaps you meant to reference the column "barracas_1.name"

O código estava tentando buscar a coluna `nome` na tabela `barracas`, mas a coluna correta no banco de dados é `name`.

## Arquivos Corrigidos

### 1. `src/contexts/AuthContext.jsx` (linha 67)

**Antes:**
```javascript
barracas:barraca_id (
  id,
  nome
)
```

**Depois:**
```javascript
barracas:barraca_id (
  id,
  name
)
```

### 2. `src/pages/admin/Users.jsx` (linha 49)

**Antes:**
```javascript
barracas:barraca_id (
  id,
  nome
)
```

**Depois:**
```javascript
barracas:barraca_id (
  id,
  name
)
```

### 3. `src/pages/admin/Users.jsx` (linha 416)

**Antes:**
```javascript
Barraca: {user.barracas.nome}
```

**Depois:**
```javascript
Barraca: {user.barracas.name}
```

## Sobre as Credenciais de Teste

As credenciais `admin@quermesse.com / admin123` **NÃO** aparecem no código-fonte da aplicação. Elas estão presentes apenas em:

- Arquivos de documentação (`.md`) - instruções de setup
- Scripts SQL de inicialização do banco

Isso está **correto** e é o comportamento esperado. As credenciais são apenas para configuração inicial do sistema.

## Resultado

✅ Erro de coluna corrigido em 3 locais  
✅ Queries agora usam `barracas.name` corretamente  
✅ Credenciais de teste não estão expostas no código da aplicação  

## Teste

Para verificar se a correção funcionou:

1. Faça login no sistema
2. O perfil do usuário deve carregar sem erros
3. A página de usuários (admin) deve exibir as barracas corretamente

---
*Correção aplicada em: 2026-06-19*