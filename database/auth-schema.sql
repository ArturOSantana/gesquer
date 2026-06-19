-- =====================================================
-- SISTEMA DE AUTENTICAÇÃO E CONTROLE DE ACESSO
-- =====================================================

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'caixa', 'barraca')),
    barraca_id UUID REFERENCES barracas(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_barraca_id ON users(barraca_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode ver todos os usuários
CREATE POLICY "Admin pode ver todos os usuários"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

-- Policy: Usuários podem ver seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
    ON users FOR SELECT
    USING (id = auth.uid());

-- Policy: Admin pode inserir novos usuários
CREATE POLICY "Admin pode inserir novos usuários"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

-- Policy: Admin pode atualizar usuários
CREATE POLICY "Admin pode atualizar usuários"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

-- Policy: Usuários podem atualizar seus próprios dados (exceto role e barraca_id)
CREATE POLICY "Usuários podem atualizar seus próprios dados"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT role FROM users WHERE id = auth.uid())
        AND barraca_id = (SELECT barraca_id FROM users WHERE id = auth.uid())
    );

-- =====================================================
-- POLICIES PARA OUTRAS TABELAS (CONTROLE DE ACESSO)
-- =====================================================

-- BARRACAS: Admin pode tudo, Barraca só vê a sua
CREATE POLICY "Admin pode ver todas as barracas"
    ON barracas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

CREATE POLICY "Barraca pode ver apenas sua barraca"
    ON barracas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'barraca'
            AND u.barraca_id = barracas.id
            AND u.active = true
        )
    );

-- PRODUTOS: Admin pode tudo, Barraca só vê seus produtos
CREATE POLICY "Admin pode ver todos os produtos"
    ON produtos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

CREATE POLICY "Barraca pode ver apenas seus produtos"
    ON produtos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'barraca'
            AND u.barraca_id = produtos.barraca_id
            AND u.active = true
        )
    );

-- VENDAS: Admin vê tudo, Barraca só suas vendas
CREATE POLICY "Admin pode ver todas as vendas"
    ON vendas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
            AND u.active = true
        )
    );

CREATE POLICY "Barraca pode ver apenas suas vendas"
    ON vendas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'barraca'
            AND u.barraca_id = vendas.barraca_id
            AND u.active = true
        )
    );

CREATE POLICY "Caixa pode ver todas as vendas"
    ON vendas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'caixa'
            AND u.active = true
        )
    );

-- CARTÕES: Admin e Caixa podem ver todos, Barraca não acessa
CREATE POLICY "Admin pode ver todos os cartões"
    ON cartoes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'caixa')
            AND u.active = true
        )
    );

-- TRANSAÇÕES: Admin e Caixa veem tudo, Barraca só suas transações
CREATE POLICY "Admin e Caixa podem ver todas as transações"
    ON transacoes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'caixa')
            AND u.active = true
        )
    );

CREATE POLICY "Barraca pode ver apenas suas transações"
    ON transacoes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN vendas v ON v.id = transacoes.venda_id
            WHERE u.id = auth.uid()
            AND u.role = 'barraca'
            AND u.barraca_id = v.barraca_id
            AND u.active = true
        )
    );

-- =====================================================
-- FUNÇÃO PARA CRIAR USUÁRIO ADMIN INICIAL
-- =====================================================

CREATE OR REPLACE FUNCTION create_initial_admin()
RETURNS void AS $$
BEGIN
    -- Verifica se já existe algum admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
        -- Cria admin inicial (senha: admin123)
        -- IMPORTANTE: Trocar a senha após primeiro login!
        INSERT INTO users (email, password_hash, name, role, active)
        VALUES (
            'admin@quermesse.com',
            '$2a$10$rKZLvVZhQxKZQKZQKZQKZu', -- Hash de 'admin123' (exemplo)
            'Administrador',
            'admin',
            true
        );
        
        RAISE NOTICE 'Usuário admin inicial criado: admin@quermesse.com / admin123';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar função para criar admin inicial
SELECT create_initial_admin();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View de usuários com informações da barraca
CREATE OR REPLACE VIEW users_with_barraca AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.active,
    u.created_at,
    u.barraca_id,
    b.nome as barraca_nome
FROM users u
LEFT JOIN barracas b ON u.barraca_id = b.id;

-- View de estatísticas por usuário (para barracas)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.role,
    COUNT(DISTINCT v.id) as total_vendas,
    COALESCE(SUM(v.valor_total), 0) as valor_total_vendas,
    COUNT(DISTINCT DATE(v.created_at)) as dias_ativos
FROM users u
LEFT JOIN vendas v ON u.barraca_id = v.barraca_id
WHERE u.role = 'barraca'
GROUP BY u.id, u.name, u.role;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE users IS 'Tabela de usuários do sistema com controle de acesso';
COMMENT ON COLUMN users.role IS 'Perfil do usuário: admin, caixa ou barraca';
COMMENT ON COLUMN users.barraca_id IS 'ID da barraca vinculada (apenas para perfil barraca)';
COMMENT ON COLUMN users.active IS 'Indica se o usuário está ativo no sistema';

-- Made with Bob
