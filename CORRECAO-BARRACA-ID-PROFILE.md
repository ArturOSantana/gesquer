# Correção: barraca_id no Profile do AuthContext

## Problema Identificado

O sistema estava salvando `barraca_id=2` corretamente no banco de dados, mas ao fazer login o profile não incluía o campo `barraca_id`.

**Log observado:**
```javascript
profile: Object { role: "barraca", name: "teste2" }
```

**Esperado:**
```javascript
profile: Object { role: "barraca", name: "teste2", barraca_id: 2 }
```

## Análise

Ao analisar o código, descobrimos que:

1. ✅ O `AuthContext.jsx` **JÁ ESTAVA CORRETO** - linha 65 já incluía `barraca_id` no select
2. ✅ O estado do profile **JÁ RECEBIA TODOS OS CAMPOS** - linha 87 usa `setProfile(data)`
3. ❓ O problema pode estar em:
   - Cache do navegador
   - Dados antigos no banco
   - Timing de carregamento

## Correções Implementadas

### 1. Logs Detalhados no AuthContext (src/contexts/AuthContext.jsx)

Adicionados logs para debug na função `loadUserProfile`:

```javascript
console.log('Dados do perfil recebidos:', data);
console.log('barraca_id no perfil:', data.barraca_id);
console.log('Tipo de barraca_id:', typeof data.barraca_id);

// ... código ...

console.log('Perfil definido no estado:', {
  id: data.id,
  name: data.name,
  role: data.role,
  barraca_id: data.barraca_id
});
```

### 2. Logs Detalhados na Página Sale (src/pages/Sale.jsx)

Adicionados logs no useEffect que processa a barraca do operador:

```javascript
console.log('Sale.jsx - useEffect barraca:', {
  isBarraca,
  profile,
  barraca_id: profile?.barraca_id,
  barracas_count: barracas.length
});

// ... código ...

console.log('Sale.jsx - Operador de barraca sem barraca_id no profile');
// ... código ...

console.log('Sale.jsx - Barraca encontrada:', barracaDoOperador);
```

## Validação

### Passo 1: Limpar Cache e Fazer Logout
```bash
# No navegador:
1. Abrir DevTools (F12)
2. Ir em Application > Storage > Clear site data
3. Fazer logout do sistema
```

### Passo 2: Fazer Login com Usuário teste2
```bash
1. Fazer login com teste2
2. Abrir Console do navegador
3. Verificar os logs:
   - "Dados do perfil recebidos:" deve mostrar barraca_id
   - "barraca_id no perfil:" deve mostrar o valor (ex: 2)
   - "Tipo de barraca_id:" deve mostrar "number"
   - "Perfil definido no estado:" deve incluir barraca_id
```

### Passo 3: Acessar Tela de Vendas
```bash
1. Navegar para /sale
2. Verificar logs no console:
   - "Sale.jsx - useEffect barraca:" deve mostrar profile com barraca_id
   - "Sale.jsx - Barraca encontrada:" deve mostrar a barraca
3. Verificar na tela:
   - Nome da barraca deve aparecer
   - Não deve mostrar erro de "barraca não vinculada"
```

### Passo 4: Verificar Banco de Dados
```sql
-- Verificar se barraca_id está salvo corretamente
SELECT id, email, name, role, barraca_id, active 
FROM users 
WHERE email = 'teste2@example.com';

-- Resultado esperado:
-- barraca_id deve ser 2 (ou outro valor válido)
```

## Possíveis Causas se Ainda Não Funcionar

### 1. Dados Antigos no Banco
Se o usuário foi criado antes da coluna `barraca_id` existir:
```sql
-- Atualizar manualmente
UPDATE users 
SET barraca_id = 2 
WHERE email = 'teste2@example.com';
```

### 2. RLS (Row Level Security) Bloqueando
Verificar se as políticas RLS permitem ler `barraca_id`:
```sql
-- Ver políticas da tabela users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 3. Cache do Supabase
```javascript
// Forçar reload do perfil
await supabase.auth.refreshSession();
```

### 4. Tipo de Dado Incorreto
Verificar se `barraca_id` é INTEGER no banco:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'barraca_id';
```

## Arquivos Modificados

1. ✅ `src/contexts/AuthContext.jsx` - Adicionados logs detalhados
2. ✅ `src/pages/Sale.jsx` - Adicionados logs detalhados

## Próximos Passos

1. Fazer logout completo
2. Limpar cache do navegador
3. Fazer login novamente
4. Verificar logs no console
5. Se ainda não funcionar, verificar banco de dados diretamente
6. Reportar os logs observados para análise adicional

## Notas Técnicas

- O AuthContext já estava buscando `barraca_id` corretamente desde o início
- O problema pode ser de dados antigos ou cache
- Os logs adicionados ajudarão a identificar exatamente onde o dado está sendo perdido
- A query do Supabase usa join com a tabela `barracas` para trazer também o nome da barraca