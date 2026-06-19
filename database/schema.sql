-- ============================================================================
-- SCHEMA DO BANCO DE DADOS - SISTEMA DE QUERMESSE
-- ============================================================================
-- Este arquivo contém o schema completo do banco de dados Supabase
-- Inclui tabelas, índices, triggers e políticas de segurança (RLS)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================

-- Habilita extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABELAS PRINCIPAIS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: clients
-- Armazena informações dos clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT clients_name_not_empty CHECK (LENGTH(TRIM(name)) >= 3),
    CONSTRAINT clients_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT clients_phone_format CHECK (phone IS NULL OR phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$')
);

-- Índices para clients
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_cpf ON clients(cpf);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Comentários
COMMENT ON TABLE clients IS 'Armazena informações dos clientes da quermesse';
COMMENT ON COLUMN clients.cpf IS 'CPF no formato 123.456.789-00';
COMMENT ON COLUMN clients.phone IS 'Telefone no formato (11) 98765-4321';

-- ----------------------------------------------------------------------------
-- Tabela: card_batches
-- Armazena lotes de cartões pré-gerados
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL,
    generated_by VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT card_batches_quantity_positive CHECK (quantity > 0),
    CONSTRAINT card_batches_status_valid CHECK (status IN ('active', 'used', 'cancelled'))
);

-- Índices para card_batches
CREATE INDEX idx_card_batches_batch_code ON card_batches(batch_code);
CREATE INDEX idx_card_batches_status ON card_batches(status);
CREATE INDEX idx_card_batches_created_at ON card_batches(created_at DESC);

-- Comentários
COMMENT ON TABLE card_batches IS 'Lotes de cartões pré-gerados para impressão';
COMMENT ON COLUMN card_batches.batch_code IS 'Código único do lote (ex: BATCH-2024-001)';
COMMENT ON COLUMN card_batches.quantity IS 'Quantidade de cartões no lote';

-- ----------------------------------------------------------------------------
-- Tabela: cards
-- Armazena os cartões pré-pagos dos clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cards (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    client_id BIGINT REFERENCES clients(id) ON DELETE RESTRICT,
    batch_id BIGINT REFERENCES card_batches(id) ON DELETE SET NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_pre_generated BOOLEAN NOT NULL DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cards_balance_positive CHECK (balance >= 0),
    CONSTRAINT cards_status_valid CHECK (status IN ('active', 'inactive', 'blocked', 'pending')),
    CONSTRAINT cards_client_required_if_not_pre_generated CHECK (
        (is_pre_generated = true) OR (client_id IS NOT NULL)
    )
);

-- Índices para cards
CREATE INDEX idx_cards_uuid ON cards(uuid);
CREATE INDEX idx_cards_client_id ON cards(client_id);
CREATE INDEX idx_cards_batch_id ON cards(batch_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_is_pre_generated ON cards(is_pre_generated);
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);

-- Comentários
COMMENT ON TABLE cards IS 'Cartões pré-pagos dos clientes';
COMMENT ON COLUMN cards.uuid IS 'UUID único usado no QR Code (formato: QUERMESSE:{uuid})';
COMMENT ON COLUMN cards.balance IS 'Saldo atual do cartão em reais';
COMMENT ON COLUMN cards.status IS 'Status do cartão: active, inactive, blocked, pending';
COMMENT ON COLUMN cards.batch_id IS 'ID do lote ao qual o cartão pertence (se pré-gerado)';
COMMENT ON COLUMN cards.is_pre_generated IS 'Indica se o cartão foi pré-gerado em lote';
COMMENT ON COLUMN cards.activated_at IS 'Data/hora de ativação do cartão pré-gerado';

-- ----------------------------------------------------------------------------
-- Tabela: barracas
-- Armazena as barracas/pontos de venda da quermesse
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barracas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    responsible VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT barracas_name_not_empty CHECK (LENGTH(TRIM(name)) >= 3),
    CONSTRAINT barracas_status_valid CHECK (status IN ('active', 'inactive'))
);

-- Índices para barracas
CREATE INDEX idx_barracas_name ON barracas(name);
CREATE INDEX idx_barracas_status ON barracas(status);
CREATE INDEX idx_barracas_created_at ON barracas(created_at DESC);

-- Comentários
COMMENT ON TABLE barracas IS 'Barracas/pontos de venda da quermesse';

-- ----------------------------------------------------------------------------
-- Tabela: products
-- Armazena os produtos disponíveis nas barracas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    barraca_id BIGINT NOT NULL REFERENCES barracas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT products_name_not_empty CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT products_price_positive CHECK (price >= 0),
    CONSTRAINT products_stock_positive CHECK (stock_quantity >= 0),
    CONSTRAINT products_min_stock_positive CHECK (min_stock >= 0),
    CONSTRAINT products_status_valid CHECK (status IN ('active', 'inactive'))
);

-- Índices para products
CREATE INDEX idx_products_barraca_id ON products(barraca_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Comentários
COMMENT ON TABLE products IS 'Produtos disponíveis nas barracas';
COMMENT ON COLUMN products.min_stock IS 'Estoque mínimo para alerta';

-- ----------------------------------------------------------------------------
-- Tabela: transactions
-- Armazena todas as transações dos cartões
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
    barraca_id BIGINT REFERENCES barracas(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT transactions_type_valid CHECK (type IN ('recharge', 'purchase', 'refund', 'transfer_in', 'transfer_out')),
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_balance_positive CHECK (balance_after >= 0)
);

-- Índices para transactions
CREATE INDEX idx_transactions_card_id ON transactions(card_id);
CREATE INDEX idx_transactions_barraca_id ON transactions(barraca_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_card_created ON transactions(card_id, created_at DESC);

-- Comentários
COMMENT ON TABLE transactions IS 'Histórico de todas as transações dos cartões';
COMMENT ON COLUMN transactions.type IS 'Tipo: recharge, purchase, refund, transfer_in, transfer_out';
COMMENT ON COLUMN transactions.metadata IS 'Dados adicionais em formato JSON';

-- ----------------------------------------------------------------------------
-- Tabela: sales
-- Armazena as vendas realizadas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
    barraca_id BIGINT NOT NULL REFERENCES barracas(id) ON DELETE RESTRICT,
    transaction_id BIGINT REFERENCES transactions(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sales_total_positive CHECK (total_amount > 0),
    CONSTRAINT sales_status_valid CHECK (status IN ('completed', 'cancelled', 'refunded'))
);

-- Índices para sales
CREATE INDEX idx_sales_card_id ON sales(card_id);
CREATE INDEX idx_sales_barraca_id ON sales(barraca_id);
CREATE INDEX idx_sales_transaction_id ON sales(transaction_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- Comentários
COMMENT ON TABLE sales IS 'Vendas realizadas nas barracas';

-- ----------------------------------------------------------------------------
-- Tabela: sale_items
-- Armazena os itens de cada venda
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT sale_items_price_positive CHECK (unit_price >= 0),
    CONSTRAINT sale_items_subtotal_valid CHECK (subtotal = quantity * unit_price)
);

-- Índices para sale_items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_sale_items_created_at ON sale_items(created_at DESC);

-- Comentários
COMMENT ON TABLE sale_items IS 'Itens individuais de cada venda';

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Atualiza updated_at automaticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica trigger em todas as tabelas com updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barracas_updated_at BEFORE UPDATE ON barracas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: Atualiza estoque após venda
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduz estoque do produto
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_after_sale AFTER INSERT ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- ----------------------------------------------------------------------------
-- Trigger: Registra transação após venda
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_transaction_for_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_card_balance DECIMAL(10, 2);
BEGIN
    -- Busca saldo atual do cartão
    SELECT balance INTO v_card_balance
    FROM cards
    WHERE id = NEW.card_id;
    
    -- Cria transação
    INSERT INTO transactions (
        card_id,
        barraca_id,
        type,
        amount,
        balance_after,
        description
    ) VALUES (
        NEW.card_id,
        NEW.barraca_id,
        'purchase',
        NEW.total_amount,
        v_card_balance - NEW.total_amount,
        'Compra na barraca'
    ) RETURNING id INTO NEW.transaction_id;
    
    -- Atualiza saldo do cartão
    UPDATE cards
    SET balance = balance - NEW.total_amount
    WHERE id = NEW.card_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_transaction_before_sale BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION create_transaction_for_sale();

-- ============================================================================
-- 4. VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: cards_with_clients
-- Cartões com informações dos clientes
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW cards_with_clients AS
SELECT 
    c.id,
    c.uuid,
    c.balance,
    c.status,
    c.created_at,
    c.updated_at,
    cl.id as client_id,
    cl.name as client_name,
    cl.phone as client_phone,
    cl.email as client_email,
    cl.cpf as client_cpf
FROM cards c
INNER JOIN clients cl ON c.client_id = cl.id;

-- ----------------------------------------------------------------------------
-- View: sales_summary
-- Resumo de vendas por barraca
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    b.id as barraca_id,
    b.name as barraca_name,
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.total_amount), 0) as total_revenue,
    COALESCE(AVG(s.total_amount), 0) as average_sale
FROM barracas b
LEFT JOIN sales s ON b.id = s.barraca_id AND s.status = 'completed'
GROUP BY b.id, b.name;

-- ----------------------------------------------------------------------------
-- View: low_stock_products
-- Produtos com estoque baixo
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.stock_quantity,
    p.min_stock,
    b.name as barraca_name,
    b.id as barraca_id
FROM products p
INNER JOIN barracas b ON p.barraca_id = b.id
WHERE p.stock_quantity <= p.min_stock
AND p.status = 'active';

-- ============================================================================
-- 5. POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE barracas ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (ajustar em produção)
CREATE POLICY "Allow all operations for authenticated users" ON clients
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON cards
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON card_batches
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON barracas
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON products
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON transactions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON sales
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON sale_items
    FOR ALL USING (true);

-- ============================================================================
-- 6. STORED PROCEDURES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: process_sale
-- Processa uma venda com validação de saldo e atualização de estoque
-- Implementa idempotência usando UUID único
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_sale(
    p_idempotency_key UUID,
    p_card_id BIGINT,
    p_barraca_id BIGINT,
    p_items JSONB -- Array de {product_id, quantity, unit_price}
)
RETURNS TABLE(
    sale_id BIGINT,
    transaction_id BIGINT,
    new_balance DECIMAL(10, 2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_card_balance DECIMAL(10, 2);
    v_card_status VARCHAR(20);
    v_total_amount DECIMAL(10, 2) := 0;
    v_sale_id BIGINT;
    v_transaction_id BIGINT;
    v_item JSONB;
    v_product_stock INTEGER;
    v_product_price DECIMAL(10, 2);
    v_subtotal DECIMAL(10, 2);
BEGIN
    -- Verifica se já existe transação com esta chave de idempotência
    SELECT t.id, s.id INTO v_transaction_id, v_sale_id
    FROM transactions t
    LEFT JOIN sales s ON s.transaction_id = t.id
    WHERE t.metadata->>'idempotency_key' = p_idempotency_key::TEXT;
    
    IF v_transaction_id IS NOT NULL THEN
        -- Transação já processada, retorna resultado anterior
        SELECT c.balance INTO v_card_balance FROM cards c WHERE c.id = p_card_id;
        RETURN QUERY SELECT v_sale_id, v_transaction_id, v_card_balance, true, 'Transação já processada anteriormente'::TEXT;
        RETURN;
    END IF;
    
    -- Bloqueia o cartão para evitar race conditions
    SELECT balance, status INTO v_card_balance, v_card_status
    FROM cards
    WHERE id = p_card_id
    FOR UPDATE;
    
    -- Valida status do cartão
    IF v_card_status != 'active' THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_card_balance, false, 'Cartão não está ativo'::TEXT;
        RETURN;
    END IF;
    
    -- Calcula total e valida estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Valida estoque do produto
        SELECT stock_quantity, price INTO v_product_stock, v_product_price
        FROM products
        WHERE id = (v_item->>'product_id')::BIGINT
        FOR UPDATE;
        
        IF v_product_stock IS NULL THEN
            RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_card_balance, false,
                'Produto não encontrado: ' || (v_item->>'product_id')::TEXT;
            RETURN;
        END IF;
        
        IF v_product_stock < (v_item->>'quantity')::INTEGER THEN
            RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_card_balance, false,
                'Estoque insuficiente para produto: ' || (v_item->>'product_id')::TEXT;
            RETURN;
        END IF;
        
        -- Calcula subtotal
        v_subtotal := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL;
        v_total_amount := v_total_amount + v_subtotal;
    END LOOP;
    
    -- Valida saldo
    IF v_card_balance < v_total_amount THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_card_balance, false,
            'Saldo insuficiente. Saldo: R$ ' || v_card_balance::TEXT || ', Total: R$ ' || v_total_amount::TEXT;
        RETURN;
    END IF;
    
    -- Atualiza saldo do cartão
    UPDATE cards
    SET balance = balance - v_total_amount,
        updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Cria transação
    INSERT INTO transactions (
        card_id,
        barraca_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        p_card_id,
        p_barraca_id,
        'purchase',
        v_total_amount,
        v_card_balance - v_total_amount,
        'Compra na barraca',
        jsonb_build_object('idempotency_key', p_idempotency_key)
    ) RETURNING id INTO v_transaction_id;
    
    -- Cria venda
    INSERT INTO sales (
        card_id,
        barraca_id,
        transaction_id,
        total_amount,
        status
    ) VALUES (
        p_card_id,
        p_barraca_id,
        v_transaction_id,
        v_total_amount,
        'completed'
    ) RETURNING id INTO v_sale_id;
    
    -- Insere itens da venda e atualiza estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL;
        
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::BIGINT,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            v_subtotal
        );
        
        -- Atualiza estoque
        UPDATE products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::BIGINT;
    END LOOP;
    
    -- Retorna sucesso
    RETURN QUERY SELECT v_sale_id, v_transaction_id, v_card_balance - v_total_amount, true, 'Venda processada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_sale IS 'Processa venda com validação de saldo, estoque e idempotência';

-- ----------------------------------------------------------------------------
-- Procedure: recharge_card
-- Realiza recarga em um cartão com validação
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recharge_card(
    p_idempotency_key UUID,
    p_card_id BIGINT,
    p_amount DECIMAL(10, 2),
    p_description TEXT DEFAULT 'Recarga de cartão'
)
RETURNS TABLE(
    transaction_id BIGINT,
    new_balance DECIMAL(10, 2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_card_balance DECIMAL(10, 2);
    v_card_status VARCHAR(20);
    v_transaction_id BIGINT;
BEGIN
    -- Verifica se já existe transação com esta chave de idempotência
    SELECT id INTO v_transaction_id
    FROM transactions
    WHERE metadata->>'idempotency_key' = p_idempotency_key::TEXT;
    
    IF v_transaction_id IS NOT NULL THEN
        -- Transação já processada, retorna resultado anterior
        SELECT c.balance INTO v_card_balance FROM cards c WHERE c.id = p_card_id;
        RETURN QUERY SELECT v_transaction_id, v_card_balance, true, 'Recarga já processada anteriormente'::TEXT;
        RETURN;
    END IF;
    
    -- Valida valor da recarga
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::DECIMAL, false, 'Valor da recarga deve ser positivo'::TEXT;
        RETURN;
    END IF;
    
    -- Bloqueia o cartão para evitar race conditions
    SELECT balance, status INTO v_card_balance, v_card_status
    FROM cards
    WHERE id = p_card_id
    FOR UPDATE;
    
    -- Valida se cartão existe
    IF v_card_balance IS NULL THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::DECIMAL, false, 'Cartão não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Valida status do cartão
    IF v_card_status = 'blocked' THEN
        RETURN QUERY SELECT NULL::BIGINT, v_card_balance, false, 'Cartão bloqueado'::TEXT;
        RETURN;
    END IF;
    
    -- Atualiza saldo do cartão
    UPDATE cards
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Cria transação
    INSERT INTO transactions (
        card_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        p_card_id,
        'recharge',
        p_amount,
        v_card_balance + p_amount,
        p_description,
        jsonb_build_object('idempotency_key', p_idempotency_key)
    ) RETURNING id INTO v_transaction_id;
    
    -- Retorna sucesso
    RETURN QUERY SELECT v_transaction_id, v_card_balance + p_amount, true, 'Recarga realizada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recharge_card IS 'Realiza recarga em cartão com validação e idempotência';

-- ----------------------------------------------------------------------------
-- Procedure: process_transfer
-- Realiza transferência entre dois cartões
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_transfer(
    p_idempotency_key UUID,
    p_from_card_id BIGINT,
    p_to_card_id BIGINT,
    p_amount DECIMAL(10, 2),
    p_description TEXT DEFAULT 'Transferência entre cartões'
)
RETURNS TABLE(
    transaction_out_id BIGINT,
    transaction_in_id BIGINT,
    from_balance DECIMAL(10, 2),
    to_balance DECIMAL(10, 2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_from_balance DECIMAL(10, 2);
    v_from_status VARCHAR(20);
    v_to_balance DECIMAL(10, 2);
    v_to_status VARCHAR(20);
    v_transaction_out_id BIGINT;
    v_transaction_in_id BIGINT;
BEGIN
    -- Verifica se já existe transação com esta chave de idempotência
    SELECT id INTO v_transaction_out_id
    FROM transactions
    WHERE metadata->>'idempotency_key' = p_idempotency_key::TEXT
    AND type = 'transfer_out';
    
    IF v_transaction_out_id IS NOT NULL THEN
        -- Transação já processada, busca transação de entrada correspondente
        SELECT id INTO v_transaction_in_id
        FROM transactions
        WHERE metadata->>'idempotency_key' = p_idempotency_key::TEXT
        AND type = 'transfer_in';
        
        SELECT balance INTO v_from_balance FROM cards WHERE id = p_from_card_id;
        SELECT balance INTO v_to_balance FROM cards WHERE id = p_to_card_id;
        
        RETURN QUERY SELECT v_transaction_out_id, v_transaction_in_id, v_from_balance, v_to_balance,
            true, 'Transferência já processada anteriormente'::TEXT;
        RETURN;
    END IF;
    
    -- Valida valor da transferência
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, NULL::DECIMAL, NULL::DECIMAL,
            false, 'Valor da transferência deve ser positivo'::TEXT;
        RETURN;
    END IF;
    
    -- Valida se não é o mesmo cartão
    IF p_from_card_id = p_to_card_id THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, NULL::DECIMAL, NULL::DECIMAL,
            false, 'Não é possível transferir para o mesmo cartão'::TEXT;
        RETURN;
    END IF;
    
    -- Bloqueia ambos os cartões (ordem crescente de ID para evitar deadlock)
    IF p_from_card_id < p_to_card_id THEN
        SELECT balance, status INTO v_from_balance, v_from_status
        FROM cards WHERE id = p_from_card_id FOR UPDATE;
        
        SELECT balance, status INTO v_to_balance, v_to_status
        FROM cards WHERE id = p_to_card_id FOR UPDATE;
    ELSE
        SELECT balance, status INTO v_to_balance, v_to_status
        FROM cards WHERE id = p_to_card_id FOR UPDATE;
        
        SELECT balance, status INTO v_from_balance, v_from_status
        FROM cards WHERE id = p_from_card_id FOR UPDATE;
    END IF;
    
    -- Valida se cartões existem
    IF v_from_balance IS NULL THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, NULL::DECIMAL, NULL::DECIMAL,
            false, 'Cartão de origem não encontrado'::TEXT;
        RETURN;
    END IF;
    
    IF v_to_balance IS NULL THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_from_balance, NULL::DECIMAL,
            false, 'Cartão de destino não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Valida status dos cartões
    IF v_from_status != 'active' THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_from_balance, v_to_balance,
            false, 'Cartão de origem não está ativo'::TEXT;
        RETURN;
    END IF;
    
    IF v_to_status = 'blocked' THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_from_balance, v_to_balance,
            false, 'Cartão de destino está bloqueado'::TEXT;
        RETURN;
    END IF;
    
    -- Valida saldo
    IF v_from_balance < p_amount THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, v_from_balance, v_to_balance,
            false, 'Saldo insuficiente no cartão de origem'::TEXT;
        RETURN;
    END IF;
    
    -- Atualiza saldo do cartão de origem
    UPDATE cards
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_card_id;
    
    -- Atualiza saldo do cartão de destino
    UPDATE cards
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_to_card_id;
    
    -- Cria transação de saída
    INSERT INTO transactions (
        card_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        p_from_card_id,
        'transfer_out',
        p_amount,
        v_from_balance - p_amount,
        p_description,
        jsonb_build_object(
            'idempotency_key', p_idempotency_key,
            'to_card_id', p_to_card_id
        )
    ) RETURNING id INTO v_transaction_out_id;
    
    -- Cria transação de entrada
    INSERT INTO transactions (
        card_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        p_to_card_id,
        'transfer_in',
        p_amount,
        v_to_balance + p_amount,
        p_description,
        jsonb_build_object(
            'idempotency_key', p_idempotency_key,
            'from_card_id', p_from_card_id
        )
    ) RETURNING id INTO v_transaction_in_id;
    
    -- Retorna sucesso
    RETURN QUERY SELECT v_transaction_out_id, v_transaction_in_id,
        v_from_balance - p_amount, v_to_balance + p_amount,
        true, 'Transferência realizada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_transfer IS 'Realiza transferência entre cartões com validação e idempotência';

-- ----------------------------------------------------------------------------
-- Procedure: bind_card_to_client
-- Vincula um cartão pré-gerado a um cliente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bind_card_to_client(
    p_card_uuid UUID,
    p_client_name VARCHAR(255),
    p_client_phone VARCHAR(20)
)
RETURNS TABLE(
    card_id BIGINT,
    client_id BIGINT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_card_id BIGINT;
    v_card_status VARCHAR(20);
    v_card_client_id BIGINT;
    v_client_id BIGINT;
    v_existing_client_id BIGINT;
BEGIN
    -- Valida nome do cliente
    IF p_client_name IS NULL OR LENGTH(TRIM(p_client_name)) < 3 THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, false,
            'Nome do cliente deve ter pelo menos 3 caracteres'::TEXT;
        RETURN;
    END IF;
    
    -- Valida telefone (formato brasileiro)
    IF p_client_phone IS NOT NULL AND p_client_phone !~ '^\(\d{2}\) \d{4,5}-\d{4}$' THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, false,
            'Telefone inválido. Use formato: (11) 98765-4321'::TEXT;
        RETURN;
    END IF;
    
    -- Busca o cartão e bloqueia para evitar race conditions
    SELECT id, status, client_id INTO v_card_id, v_card_status, v_card_client_id
    FROM cards
    WHERE uuid = p_card_uuid
    FOR UPDATE;
    
    -- Valida se cartão existe
    IF v_card_id IS NULL THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, false,
            'Cartão não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Valida se cartão está disponível (pending = pré-gerado não vinculado)
    IF v_card_status != 'pending' THEN
        RETURN QUERY SELECT v_card_id, v_card_client_id, false,
            'Cartão não está disponível para vinculação. Status: ' || v_card_status::TEXT;
        RETURN;
    END IF;
    
    -- Valida se cartão já está vinculado
    IF v_card_client_id IS NOT NULL THEN
        RETURN QUERY SELECT v_card_id, v_card_client_id, false,
            'Cartão já está vinculado a um cliente'::TEXT;
        RETURN;
    END IF;
    
    -- Verifica se já existe cliente com este telefone
    IF p_client_phone IS NOT NULL THEN
        SELECT id INTO v_existing_client_id
        FROM clients
        WHERE phone = p_client_phone;
        
        IF v_existing_client_id IS NOT NULL THEN
            -- Cliente já existe, usa o existente
            v_client_id := v_existing_client_id;
        END IF;
    END IF;
    
    -- Se cliente não existe, cria novo
    IF v_client_id IS NULL THEN
        INSERT INTO clients (name, phone)
        VALUES (TRIM(p_client_name), p_client_phone)
        RETURNING id INTO v_client_id;
    END IF;
    
    -- Vincula cartão ao cliente e ativa
    UPDATE cards
    SET
        client_id = v_client_id,
        status = 'active',
        activated_at = NOW(),
        updated_at = NOW()
    WHERE id = v_card_id;
    
    -- Retorna sucesso
    RETURN QUERY SELECT v_card_id, v_client_id, true,
        'Cartão vinculado com sucesso ao cliente'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bind_card_to_client IS 'Vincula cartão pré-gerado a cliente novo ou existente';

-- ----------------------------------------------------------------------------
-- Procedure: transfer_card_balance
-- Transfere saldo de um cartão antigo para um novo (substituição de cartão)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION transfer_card_balance(
    p_idempotency_key UUID,
    p_old_card_uuid UUID,
    p_new_card_uuid UUID,
    p_description TEXT DEFAULT 'Transferência por substituição de cartão'
)
RETURNS TABLE(
    old_card_id BIGINT,
    new_card_id BIGINT,
    transferred_amount DECIMAL(10, 2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_old_card_id BIGINT;
    v_old_card_status VARCHAR(20);
    v_old_card_balance DECIMAL(10, 2);
    v_old_card_client_id BIGINT;
    v_new_card_id BIGINT;
    v_new_card_status VARCHAR(20);
    v_new_card_client_id BIGINT;
    v_transaction_out_id BIGINT;
    v_transaction_in_id BIGINT;
BEGIN
    -- Verifica se já existe transação com esta chave de idempotência
    SELECT id INTO v_transaction_out_id
    FROM transactions
    WHERE metadata->>'idempotency_key' = p_idempotency_key::TEXT
    AND type = 'transfer_out';
    
    IF v_transaction_out_id IS NOT NULL THEN
        -- Transação já processada
        SELECT c1.id, c2.id, c1.balance
        INTO v_old_card_id, v_new_card_id, v_old_card_balance
        FROM cards c1, cards c2
        WHERE c1.uuid = p_old_card_uuid AND c2.uuid = p_new_card_uuid;
        
        RETURN QUERY SELECT v_old_card_id, v_new_card_id, v_old_card_balance,
            true, 'Transferência já processada anteriormente'::TEXT;
        RETURN;
    END IF;
    
    -- Busca cartão antigo e bloqueia
    SELECT id, status, balance, client_id
    INTO v_old_card_id, v_old_card_status, v_old_card_balance, v_old_card_client_id
    FROM cards
    WHERE uuid = p_old_card_uuid
    FOR UPDATE;
    
    -- Valida cartão antigo
    IF v_old_card_id IS NULL THEN
        RETURN QUERY SELECT NULL::BIGINT, NULL::BIGINT, NULL::DECIMAL, false,
            'Cartão antigo não encontrado'::TEXT;
        RETURN;
    END IF;
    
    IF v_old_card_status != 'active' THEN
        RETURN QUERY SELECT v_old_card_id, NULL::BIGINT, v_old_card_balance, false,
            'Cartão antigo não está ativo'::TEXT;
        RETURN;
    END IF;
    
    IF v_old_card_client_id IS NULL THEN
        RETURN QUERY SELECT v_old_card_id, NULL::BIGINT, v_old_card_balance, false,
            'Cartão antigo não está vinculado a um cliente'::TEXT;
        RETURN;
    END IF;
    
    -- Busca cartão novo e bloqueia
    SELECT id, status, client_id
    INTO v_new_card_id, v_new_card_status, v_new_card_client_id
    FROM cards
    WHERE uuid = p_new_card_uuid
    FOR UPDATE;
    
    -- Valida cartão novo
    IF v_new_card_id IS NULL THEN
        RETURN QUERY SELECT v_old_card_id, NULL::BIGINT, v_old_card_balance, false,
            'Cartão novo não encontrado'::TEXT;
        RETURN;
    END IF;
    
    IF v_new_card_status != 'pending' THEN
        RETURN QUERY SELECT v_old_card_id, v_new_card_id, v_old_card_balance, false,
            'Cartão novo não está disponível. Status: ' || v_new_card_status::TEXT;
        RETURN;
    END IF;
    
    IF v_new_card_client_id IS NOT NULL THEN
        RETURN QUERY SELECT v_old_card_id, v_new_card_id, v_old_card_balance, false,
            'Cartão novo já está vinculado a um cliente'::TEXT;
        RETURN;
    END IF;
    
    -- Valida se não é o mesmo cartão
    IF v_old_card_id = v_new_card_id THEN
        RETURN QUERY SELECT v_old_card_id, v_new_card_id, v_old_card_balance, false,
            'Não é possível transferir para o mesmo cartão'::TEXT;
        RETURN;
    END IF;
    
    -- Se não há saldo, apenas vincula o novo cartão
    IF v_old_card_balance = 0 THEN
        -- Desativa cartão antigo
        UPDATE cards
        SET status = 'inactive',
            updated_at = NOW()
        WHERE id = v_old_card_id;
        
        -- Vincula e ativa cartão novo
        UPDATE cards
        SET client_id = v_old_card_client_id,
            status = 'active',
            activated_at = NOW(),
            updated_at = NOW()
        WHERE id = v_new_card_id;
        
        RETURN QUERY SELECT v_old_card_id, v_new_card_id, 0::DECIMAL, true,
            'Cartão substituído com sucesso (sem saldo para transferir)'::TEXT;
        RETURN;
    END IF;
    
    -- Transfere saldo do cartão antigo para o novo
    UPDATE cards
    SET balance = 0,
        status = 'inactive',
        updated_at = NOW()
    WHERE id = v_old_card_id;
    
    UPDATE cards
    SET balance = v_old_card_balance,
        client_id = v_old_card_client_id,
        status = 'active',
        activated_at = NOW(),
        updated_at = NOW()
    WHERE id = v_new_card_id;
    
    -- Registra transação de saída no cartão antigo
    INSERT INTO transactions (
        card_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        v_old_card_id,
        'transfer_out',
        v_old_card_balance,
        0,
        p_description,
        jsonb_build_object(
            'idempotency_key', p_idempotency_key,
            'to_card_id', v_new_card_id,
            'transfer_type', 'card_replacement'
        )
    ) RETURNING id INTO v_transaction_out_id;
    
    -- Registra transação de entrada no cartão novo
    INSERT INTO transactions (
        card_id,
        type,
        amount,
        balance_after,
        description,
        metadata
    ) VALUES (
        v_new_card_id,
        'transfer_in',
        v_old_card_balance,
        v_old_card_balance,
        p_description,
        jsonb_build_object(
            'idempotency_key', p_idempotency_key,
            'from_card_id', v_old_card_id,
            'transfer_type', 'card_replacement'
        )
    ) RETURNING id INTO v_transaction_in_id;
    
    -- Retorna sucesso
    RETURN QUERY SELECT v_old_card_id, v_new_card_id, v_old_card_balance, true,
        'Saldo transferido e cartão substituído com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transfer_card_balance IS 'Transfere saldo de cartão antigo para novo (substituição)';

-- ============================================================================
-- 7. DADOS INICIAIS (SEED)
-- ============================================================================

-- Insere barraca de exemplo
INSERT INTO barracas (name, description, responsible, status)
VALUES
    ('Barraca Principal', 'Barraca principal da quermesse', 'Administrador', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Comentário final
COMMENT ON SCHEMA public IS 'Schema principal do sistema de quermesse';

-- Made with Bob
