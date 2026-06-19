# Correção: Incompatibilidade de Tipos - barraca_id

## 📋 Problema Identificado

**Erro SQL:**
```
foreign key constraint 'users_barraca_id_fkey' cannot be implemented. 
Key columns 'barraca_id' and 'id' are of incompatible types: uuid and bigint.
```

## 🔍 Causa Raiz

A tabela `barracas` foi criada com `id` do tipo **BIGSERIAL** (BIGINT), mas o script `supabase-auth-sync.sql` estava tentando criar uma foreign key com `barraca_id` do tipo **UUID**.

### Schema Original da Tabela barracas:
```sql
CREATE TABLE IF NOT EXISTS barracas (
    id BIGSERIAL PRIMARY KEY,  -- ← Tipo BIGINT
    name VARCHAR(255) NOT NULL,
    description TEXT,
    responsible VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Problema no Script users:
```sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'caixa', 'barraca')),
    barraca_id UUID REFERENCES barracas(id) ON DELETE SET NULL,  -- ❌ UUID incompatível
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ✅ Solução Aplicada

Alterado o tipo de `barraca_id` de **UUID** para **BIGINT** no arquivo `database/supabase-auth-sync.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'caixa', 'barraca')),
    barraca_id BIGINT REFERENCES barracas(id) ON DELETE SET NULL,  -- ✅ BIGINT compatível
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📝 Arquivos Modificados

- ✅ `database/supabase-auth-sync.sql` - Linha 16: `barraca_id UUID` → `barraca_id BIGINT`
- ✅ `database/supabase-auth-sync.sql` - Linha 180: Atualizado comentário da coluna

## 🎯 Impacto

- **Compatibilidade:** Foreign key agora funciona corretamente
- **Integridade:** Relacionamento entre `users` e `barracas` mantido
- **Sem Breaking Changes:** Não afeta código existente pois a tabela ainda não estava em produção

## 🔄 Próximos Passos

1. Executar o script `supabase-auth-sync.sql` no Supabase
2. Verificar se a foreign key foi criada com sucesso
3. Testar vinculação de usuários às barracas

## 📚 Referências

- Arquivo: `database/schema.sql` (linha 123)
- Arquivo: `database/supabase-auth-sync.sql` (linha 16)
- PostgreSQL: BIGSERIAL é equivalente a BIGINT com AUTO_INCREMENT

---

**Data da Correção:** 2026-06-19  
**Responsável:** Bob (AI Assistant)