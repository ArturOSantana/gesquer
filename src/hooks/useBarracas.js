import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gerenciar barracas
 * Fornece funções para CRUD completo de barracas
 */
export function useBarracas() {
  const [barracas, setBarracas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Busca todas as barracas
   */
  const fetchBarracas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('barracas')
        .select('*')
        .order('name', { ascending: true });

      // Aplica filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBarracas(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar barracas:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca barracas ativas
   */
  const fetchActiveBarracas = useCallback(async () => {
    return fetchBarracas({ status: 'active' });
  }, [fetchBarracas]);

  /**
   * Busca uma barraca por ID
   */
  const getBarracaById = useCallback(async (barracaId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('barracas')
        .select('*')
        .eq('id', barracaId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria uma nova barraca
   */
  const createBarraca = useCallback(async (barracaData) => {
    try {
      setLoading(true);
      setError(null);

      // Valida dados obrigatórios
      if (!barracaData.name || barracaData.name.trim().length < 3) {
        throw new Error('Nome da barraca deve ter pelo menos 3 caracteres');
      }

      const { data, error: insertError } = await supabase
        .from('barracas')
        .insert([{
          name: barracaData.name.trim(),
          description: barracaData.description?.trim() || null,
          responsible: barracaData.responsible?.trim() || null,
          status: barracaData.status || 'active'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualiza lista de barracas
      await fetchBarracas();

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBarracas]);

  /**
   * Atualiza uma barraca existente
   */
  const updateBarraca = useCallback(async (barracaId, barracaData) => {
    try {
      setLoading(true);
      setError(null);

      // Valida dados obrigatórios
      if (barracaData.name && barracaData.name.trim().length < 3) {
        throw new Error('Nome da barraca deve ter pelo menos 3 caracteres');
      }

      const updateData = {};
      if (barracaData.name !== undefined) {
        updateData.name = barracaData.name.trim();
      }
      if (barracaData.description !== undefined) {
        updateData.description = barracaData.description?.trim() || null;
      }
      if (barracaData.responsible !== undefined) {
        updateData.responsible = barracaData.responsible?.trim() || null;
      }
      if (barracaData.status !== undefined) {
        updateData.status = barracaData.status;
      }

      const { data, error: updateError } = await supabase
        .from('barracas')
        .update(updateData)
        .eq('id', barracaId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualiza lista de barracas
      await fetchBarracas();

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBarracas]);

  /**
   * Deleta uma barraca
   */
  const deleteBarraca = useCallback(async (barracaId) => {
    try {
      setLoading(true);
      setError(null);

      // Verifica se há produtos associados
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('barraca_id', barracaId)
        .limit(1);

      if (products && products.length > 0) {
        throw new Error('Não é possível deletar barraca com produtos cadastrados. Desative-a ao invés de deletar.');
      }

      // Verifica se há vendas associadas
      const { data: sales } = await supabase
        .from('sales')
        .select('id')
        .eq('barraca_id', barracaId)
        .limit(1);

      if (sales && sales.length > 0) {
        throw new Error('Não é possível deletar barraca com histórico de vendas. Desative-a ao invés de deletar.');
      }

      const { error: deleteError } = await supabase
        .from('barracas')
        .delete()
        .eq('id', barracaId);

      if (deleteError) throw deleteError;

      // Atualiza lista de barracas
      await fetchBarracas();

      return { success: true, error: null };
    } catch (err) {
      console.error('Erro ao deletar barraca:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBarracas]);

  /**
   * Ativa ou desativa uma barraca
   */
  const toggleBarracaStatus = useCallback(async (barracaId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return updateBarraca(barracaId, { status: newStatus });
  }, [updateBarraca]);

  /**
   * Busca estatísticas de uma barraca
   */
  const getBarracaStats = useCallback(async (barracaId) => {
    try {
      setLoading(true);
      setError(null);

      // Busca total de vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, status')
        .eq('barraca_id', barracaId);

      if (salesError) throw salesError;

      // Busca total de produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, status, stock_quantity')
        .eq('barraca_id', barracaId);

      if (productsError) throw productsError;

      // Calcula estatísticas
      const completedSales = salesData.filter(s => s.status === 'completed');
      const totalRevenue = completedSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      const activeProducts = productsData.filter(p => p.status === 'active').length;
      const totalStock = productsData.reduce((sum, p) => sum + p.stock_quantity, 0);

      const stats = {
        totalSales: completedSales.length,
        totalRevenue,
        averageSale: completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
        totalProducts: productsData.length,
        activeProducts,
        totalStock
      };

      return { data: stats, error: null };
    } catch (err) {
      console.error('Erro ao buscar estatísticas da barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca produtos de uma barraca
   */
  const getBarracaProducts = useCallback(async (barracaId, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*')
        .eq('barraca_id', barracaId)
        .order('name', { ascending: true });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar produtos da barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca vendas de uma barraca
   */
  const getBarracaSales = useCallback(async (barracaId, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sales')
        .select(`
          *,
          card:cards(
            id,
            uuid,
            client:clients(
              id,
              name
            )
          )
        `)
        .eq('barraca_id', barracaId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

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
      console.error('Erro ao buscar vendas da barraca:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega barracas ao montar o componente
  useEffect(() => {
    fetchBarracas();
  }, [fetchBarracas]);

  return {
    // Estado
    barracas,
    loading,
    error,

    // Funções CRUD
    fetchBarracas,
    fetchActiveBarracas,
    getBarracaById,
    createBarraca,
    updateBarraca,
    deleteBarraca,
    toggleBarracaStatus,

    // Funções relacionadas
    getBarracaStats,
    getBarracaProducts,
    getBarracaSales
  };
}

// Made with Bob
