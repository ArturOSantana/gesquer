import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gerenciar produtos
 * Fornece funções para CRUD completo de produtos e gestão de estoque
 */
export function useProducts(barracaId = null) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  /**
   * Busca todos os produtos com filtros opcionais
   */
  const fetchProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          *,
          barraca:barracas(
            id,
            name,
            status
          )
        `)
        .order('name', { ascending: true });

      // Aplica filtros
      if (filters.barraca_id || barracaId) {
        query = query.eq('barraca_id', filters.barraca_id || barracaId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.low_stock) {
        query = query.lte('stock_quantity', supabase.raw('min_stock'));
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProducts(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [barracaId]);

  /**
   * Busca produtos ativos
   */
  const fetchActiveProducts = useCallback(async (barracaIdFilter = null) => {
    return fetchProducts({ 
      status: 'active',
      barraca_id: barracaIdFilter 
    });
  }, [fetchProducts]);

  /**
   * Busca um produto por ID
   */
  const getProductById = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          barraca:barracas(
            id,
            name,
            status
          )
        `)
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo produto
   */
  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);

      // Valida dados obrigatórios
      if (!productData.name || productData.name.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres');
      }

      if (!productData.barraca_id) {
        throw new Error('Barraca é obrigatória');
      }

      if (productData.price === undefined || productData.price < 0) {
        throw new Error('Preço deve ser maior ou igual a zero');
      }

      const { data, error: insertError } = await supabase
        .from('products')
        .insert([{
          barraca_id: productData.barraca_id,
          name: productData.name.trim(),
          description: productData.description?.trim() || null,
          price: parseFloat(productData.price),
          stock_quantity: parseInt(productData.stock_quantity) || 0,
          min_stock: parseInt(productData.min_stock) || 0,
          status: productData.status || 'active'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualiza lista de produtos
      await fetchProducts({ barraca_id: productData.barraca_id });

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Atualiza um produto existente
   */
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setLoading(true);
      setError(null);

      // Valida dados
      if (productData.name && productData.name.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres');
      }

      if (productData.price !== undefined && productData.price < 0) {
        throw new Error('Preço deve ser maior ou igual a zero');
      }

      const updateData = {};
      if (productData.name !== undefined) {
        updateData.name = productData.name.trim();
      }
      if (productData.description !== undefined) {
        updateData.description = productData.description?.trim() || null;
      }
      if (productData.price !== undefined) {
        updateData.price = parseFloat(productData.price);
      }
      if (productData.stock_quantity !== undefined) {
        updateData.stock_quantity = parseInt(productData.stock_quantity);
      }
      if (productData.min_stock !== undefined) {
        updateData.min_stock = parseInt(productData.min_stock);
      }
      if (productData.status !== undefined) {
        updateData.status = productData.status;
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualiza lista de produtos
      await fetchProducts();

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Verifica dependências de um produto antes de deletar
   * Retorna avisos sobre estoque e vendas
   */
  const checkProductDependencies = useCallback(async (productId) => {
    try {
      const warnings = [];

      // Busca informações do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name, price')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Verifica estoque atual
      if (product.stock_quantity > 0) {
        warnings.push(`Estoque atual: ${product.stock_quantity} unidade(s)`);
      }

      // Verifica vendas associadas
      const { data: saleItems, error: salesError } = await supabase
        .from('sale_items')
        .select('id, quantity, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      if (saleItems && saleItems.length > 0) {
        warnings.push(`${saleItems.length} venda(s) no histórico`);
        
        // Verifica vendas recentes (últimos 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSales = saleItems.filter(
          item => new Date(item.created_at) > sevenDaysAgo
        );
        
        if (recentSales.length > 0) {
          warnings.push(`${recentSales.length} venda(s) nos últimos 7 dias`);
        }
      }

      return {
        canDelete: saleItems.length === 0,
        warnings,
        dependencies: {
          stock: product.stock_quantity,
          sales: saleItems.length
        }
      };
    } catch (err) {
      console.error('Erro ao verificar dependências do produto:', err);
      return {
        canDelete: false,
        warnings: ['Erro ao verificar dependências'],
        error: err.message
      };
    }
  }, []);

  /**
   * Deleta um produto (apenas SuperAdmin)
   * Verifica dependências antes de deletar
   */
  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);

      // Verifica dependências
      const { canDelete, dependencies } = await checkProductDependencies(productId);

      if (!canDelete) {
        throw new Error('Não é possível deletar produto com histórico de vendas. Desative-o ao invés de deletar.');
      }

      // Deleta o produto
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      // Atualiza lista de produtos
      await fetchProducts();

      return { success: true, error: null };
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [checkProductDependencies, fetchProducts]);

  /**
   * Atualiza o estoque de um produto
   */
  const updateStock = useCallback(async (productId, quantity, operation = 'set') => {
    try {
      setLoading(true);
      setError(null);

      // Busca produto atual
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      let newQuantity;
      switch (operation) {
        case 'add':
          newQuantity = product.stock_quantity + quantity;
          break;
        case 'subtract':
          newQuantity = product.stock_quantity - quantity;
          break;
        case 'set':
        default:
          newQuantity = quantity;
          break;
      }

      if (newQuantity < 0) {
        throw new Error('Estoque não pode ser negativo');
      }

      const { data, error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualiza lista de produtos
      await fetchProducts();

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Ativa ou desativa um produto
   */
  const toggleProductStatus = useCallback(async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return updateProduct(productId, { status: newStatus });
  }, [updateProduct]);

  /**
   * Busca produtos com estoque baixo
   */
  const fetchLowStockProducts = useCallback(async (barracaIdFilter = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('low_stock_products')
        .select('*')
        .order('stock_quantity', { ascending: true });

      if (barracaIdFilter || barracaId) {
        query = query.eq('barraca_id', barracaIdFilter || barracaId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLowStockProducts(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar produtos com estoque baixo:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [barracaId]);

  /**
   * Verifica se um produto tem estoque suficiente
   */
  const checkStock = useCallback(async (productId, quantity) => {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (!product) {
        return { available: false, message: 'Produto não encontrado' };
      }

      if (product.stock_quantity < quantity) {
        return {
          available: false,
          message: `Estoque insuficiente. Disponível: ${product.stock_quantity}`,
          currentStock: product.stock_quantity
        };
      }

      return {
        available: true,
        message: 'Estoque disponível',
        currentStock: product.stock_quantity
      };
    } catch (err) {
      console.error('Erro ao verificar estoque:', err);
      return { available: false, message: err.message };
    }
  }, []);

  /**
   * Busca histórico de vendas de um produto
   */
  const getProductSalesHistory = useCallback(async (productId, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sale_items')
        .select(`
          *,
          sale:sales(
            id,
            total_amount,
            status,
            created_at,
            card:cards(
              id,
              uuid,
              client:clients(
                id,
                name
              )
            )
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar histórico de vendas:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcula estatísticas de um produto
   */
  const getProductStats = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);

      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('quantity, subtotal')
        .eq('product_id', productId);

      const totalQuantitySold = saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const totalRevenue = saleItems?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0;

      const stats = {
        totalQuantitySold,
        totalRevenue,
        totalSales: saleItems?.length || 0,
        averageQuantityPerSale: saleItems?.length > 0 ? totalQuantitySold / saleItems.length : 0
      };

      return { data: stats, error: null };
    } catch (err) {
      console.error('Erro ao buscar estatísticas do produto:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega produtos ao montar o componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Monitora produtos com estoque baixo
  useEffect(() => {
    fetchLowStockProducts();
  }, [fetchLowStockProducts]);

  return {
    // Estado
    products,
    loading,
    error,
    lowStockProducts,

    // Funções CRUD
    fetchProducts,
    fetchActiveProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    checkProductDependencies,

    // Funções de estoque
    updateStock,
    checkStock,
    fetchLowStockProducts,

    // Funções de análise
    getProductSalesHistory,
    getProductStats
  };
}

// Made with Bob
