import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook para gerenciar transações
 * Fornece funções para buscar, criar e filtrar transações
 */
export function useTransactions() {
  const { profile, isBarraca } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Busca todas as transações com filtros opcionais
   */
  const fetchTransactions = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const effectiveFilters = { ...filters };

      if (isBarraca) {
        if (!profile?.barraca_id) {
          throw new Error('Usuário de barraca sem barraca vinculada');
        }

        if (
          effectiveFilters.barraca_id &&
          effectiveFilters.barraca_id !== profile.barraca_id
        ) {
          throw new Error('Operador de barraca só pode consultar transações da sua própria barraca');
        }

        effectiveFilters.barraca_id = profile.barraca_id;
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          card:cards(
            id,
            uuid,
            balance,
            client:clients(
              id,
              name,
              phone
            )
          ),
          barraca:barracas(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Aplica filtros
      if (effectiveFilters.type) {
        query = query.eq('type', effectiveFilters.type);
      }

      if (effectiveFilters.card_id) {
        query = query.eq('card_id', effectiveFilters.card_id);
      }

      if (effectiveFilters.barraca_id) {
        query = query.eq('barraca_id', effectiveFilters.barraca_id);
      }

      if (effectiveFilters.start_date) {
        query = query.gte('created_at', effectiveFilters.start_date);
      }

      if (effectiveFilters.end_date) {
        query = query.lte('created_at', effectiveFilters.end_date);
      }

      if (effectiveFilters.limit) {
        query = query.limit(effectiveFilters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTransactions(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca transações de um cartão específico
   */
  const getTransactionsByCard = useCallback(async (cardId, limit = 50) => {
    return fetchTransactions({ card_id: cardId, limit });
  }, [fetchTransactions]);

  /**
   * Busca transações de uma barraca específica
   */
  const getTransactionsByBarraca = useCallback(async (barracaId, filters = {}) => {
    return fetchTransactions({ ...filters, barraca_id: barracaId });
  }, [fetchTransactions]);

  /**
   * Processa uma venda usando stored procedure
   */
  const processSale = useCallback(async (saleData) => {
    try {
      setLoading(true);
      setError(null);

      const { card_id, barraca_id, items } = saleData;

      if (isBarraca) {
        if (!profile?.barraca_id) {
          throw new Error('Usuário de barraca sem barraca vinculada');
        }

        if (barraca_id && barraca_id !== profile.barraca_id) {
          throw new Error('Operador de barraca só pode cobrar na barraca vinculada ao seu usuário');
        }
      }

      const effectiveBarracaId = isBarraca ? profile?.barraca_id : barraca_id;

      if (!effectiveBarracaId) {
        throw new Error('Barraca obrigatória para processar a venda');
      }

      if (!card_id) {
        throw new Error('Cartão obrigatório para processar a venda');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Informe ao menos um item para processar a venda');
      }

      // Gera chave de idempotência única
      const idempotencyKey = crypto.randomUUID();

      // Chama stored procedure
      const { data, error: rpcError } = await supabase.rpc('process_sale', {
        p_idempotency_key: idempotencyKey,
        p_card_id: card_id,
        p_barraca_id: effectiveBarracaId,
        p_items: items
      });

      if (rpcError) throw rpcError;

      // Verifica resultado
      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      // Atualiza lista de transações
      await fetchTransactions({ card_id, limit: 10 });

      return {
        success: true,
        sale_id: result.sale_id,
        transaction_id: result.transaction_id,
        new_balance: result.new_balance,
        message: result.message
      };
    } catch (err) {
      console.error('Erro ao processar venda:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, isBarraca, profile?.barraca_id]);

  /**
   * Realiza recarga em um cartão usando stored procedure
   */
  const rechargeCard = useCallback(async (cardId, amount, description = 'Recarga de cartão') => {
    try {
      setLoading(true);
      setError(null);

      // Gera chave de idempotência única
      const idempotencyKey = crypto.randomUUID();

      // Chama stored procedure
      const { data, error: rpcError } = await supabase.rpc('recharge_card', {
        p_idempotency_key: idempotencyKey,
        p_card_id: cardId,
        p_amount: amount,
        p_description: description
      });

      if (rpcError) throw rpcError;

      // Verifica resultado
      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      // Atualiza lista de transações
      await fetchTransactions({ card_id: cardId, limit: 10 });

      return {
        success: true,
        transaction_id: result.transaction_id,
        new_balance: result.new_balance,
        message: result.message
      };
    } catch (err) {
      console.error('Erro ao recarregar cartão:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  /**
   * Processa transferência entre cartões usando stored procedure
   */
  const processTransfer = useCallback(async (fromCardId, toCardId, amount, description = 'Transferência entre cartões') => {
    try {
      setLoading(true);
      setError(null);

      // Gera chave de idempotência única
      const idempotencyKey = crypto.randomUUID();

      // Chama stored procedure
      const { data, error: rpcError } = await supabase.rpc('process_transfer', {
        p_idempotency_key: idempotencyKey,
        p_from_card_id: fromCardId,
        p_to_card_id: toCardId,
        p_amount: amount,
        p_description: description
      });

      if (rpcError) throw rpcError;

      // Verifica resultado
      const result = data[0];
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        transaction_out_id: result.transaction_out_id,
        transaction_in_id: result.transaction_in_id,
        from_balance: result.from_balance,
        to_balance: result.to_balance,
        message: result.message
      };
    } catch (err) {
      console.error('Erro ao processar transferência:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcula estatísticas de transações
   */
  const getTransactionStats = useCallback((transactionList = transactions) => {
    const stats = {
      total: transactionList.length,
      totalAmount: 0,
      byType: {
        recharge: { count: 0, amount: 0 },
        purchase: { count: 0, amount: 0 },
        refund: { count: 0, amount: 0 },
        transfer_in: { count: 0, amount: 0 },
        transfer_out: { count: 0, amount: 0 }
      }
    };

    transactionList.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      stats.totalAmount += amount;

      if (stats.byType[transaction.type]) {
        stats.byType[transaction.type].count++;
        stats.byType[transaction.type].amount += amount;
      }
    });

    return stats;
  }, [transactions]);

  /**
   * Busca uma transação específica por ID
   */
  const getTransactionById = useCallback(async (transactionId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          card:cards(
            id,
            uuid,
            balance,
            client:clients(
              id,
              name,
              phone
            )
          ),
          barraca:barracas(
            id,
            name
          )
        `)
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar transação:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca transações recentes (últimas 24h)
   */
  const getRecentTransactions = useCallback(async (limit = 20) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return fetchTransactions({
      start_date: yesterday.toISOString(),
      limit
    });
  }, [fetchTransactions]);

  return {
    // Estado
    transactions,
    loading,
    error,

    // Funções de busca
    fetchTransactions,
    getTransactionsByCard,
    getTransactionsByBarraca,
    getTransactionById,
    getRecentTransactions,

    // Funções de operação
    processSale,
    rechargeCard,
    processTransfer,

    // Utilitários
    getTransactionStats
  };
}

// Made with Bob
