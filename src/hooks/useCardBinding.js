import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { validatePhone } from '@/lib/validators';

/**
 * Hook para gerenciar vinculação de cartões pré-impressos
 * Permite vincular cartões do lote a clientes e transferir saldos
 */
export function useCardBinding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Verifica se um cartão está disponível para vinculação
   * @param {string} cardUuid - UUID do cartão
   * @returns {Object} { available, card, error }
   */
  const checkCardAvailability = async (cardUuid) => {
    setLoading(true);
    setError(null);

    try {
      // Busca o cartão
      const { data: card, error: fetchError } = await supabase
        .from('cards')
        .select(`
          id,
          uuid,
          status,
          balance,
          is_pre_generated,
          client_id,
          batch_id,
          client:clients(id, name, phone)
        `)
        .eq('uuid', cardUuid)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            available: false,
            card: null,
            error: 'Cartão não encontrado'
          };
        }
        throw fetchError;
      }

      // Verifica se está disponível (pending = pré-gerado não vinculado)
      const available = card.status === 'pending' && card.client_id === null;

      return {
        available,
        card,
        error: null
      };
    } catch (err) {
      console.error('Erro ao verificar disponibilidade do cartão:', err);
      setError(err.message);
      return {
        available: false,
        card: null,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vincula um cartão pré-gerado a um cliente
   * @param {string} cardUuid - UUID do cartão
   * @param {string} clientName - Nome do cliente
   * @param {string} clientPhone - Telefone do cliente
   * @returns {Object} { success, card, client, error }
   */
  const bindCardToClient = async (cardUuid, clientName, clientPhone) => {
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!clientName || clientName.trim().length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }

      if (clientPhone && !validatePhone(clientPhone)) {
        throw new Error('Telefone inválido. Use formato: (11) 98765-4321');
      }

      // Chama a stored procedure
      const { data, error: rpcError } = await supabase
        .rpc('bind_card_to_client', {
          p_card_uuid: cardUuid,
          p_client_name: clientName.trim(),
          p_client_phone: clientPhone || null
        });

      if (rpcError) throw rpcError;

      // Verifica resultado
      const result = data[0];
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Busca o cartão vinculado com dados completos
      const { data: card, error: fetchError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*),
          batch:card_batches(*)
        `)
        .eq('id', result.card_id)
        .single();

      if (fetchError) throw fetchError;

      return {
        success: true,
        card,
        client: card.client,
        message: result.message,
        error: null
      };
    } catch (err) {
      console.error('Erro ao vincular cartão:', err);
      setError(err.message);
      return {
        success: false,
        card: null,
        client: null,
        message: null,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transfere saldo de um cartão antigo para um novo (substituição)
   * @param {string} oldCardUuid - UUID do cartão antigo
   * @param {string} newCardUuid - UUID do cartão novo
   * @returns {Object} { success, oldCard, newCard, transferredAmount, error }
   */
  const transferCardBalance = async (oldCardUuid, newCardUuid) => {
    setLoading(true);
    setError(null);

    try {
      // Gera chave de idempotência
      const idempotencyKey = crypto.randomUUID();

      // Chama a stored procedure
      const { data, error: rpcError } = await supabase
        .rpc('transfer_card_balance', {
          p_idempotency_key: idempotencyKey,
          p_old_card_uuid: oldCardUuid,
          p_new_card_uuid: newCardUuid,
          p_description: 'Transferência por substituição de cartão'
        });

      if (rpcError) throw rpcError;

      // Verifica resultado
      const result = data[0];
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Busca os cartões atualizados
      const { data: oldCard, error: oldCardError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', result.old_card_id)
        .single();

      if (oldCardError) throw oldCardError;

      const { data: newCard, error: newCardError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', result.new_card_id)
        .single();

      if (newCardError) throw newCardError;

      return {
        success: true,
        oldCard,
        newCard,
        transferredAmount: result.transferred_amount,
        message: result.message,
        error: null
      };
    } catch (err) {
      console.error('Erro ao transferir saldo:', err);
      setError(err.message);
      return {
        success: false,
        oldCard: null,
        newCard: null,
        transferredAmount: 0,
        message: null,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca cartões disponíveis de um lote específico
   * @param {number} batchId - ID do lote
   * @returns {Object} { cards, error }
   */
  const getAvailableCardsFromBatch = async (batchId) => {
    setLoading(true);
    setError(null);

    try {
      const { data: cards, error: fetchError } = await supabase
        .from('cards')
        .select('id, uuid, status, created_at')
        .eq('batch_id', batchId)
        .eq('status', 'pending')
        .is('client_id', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      return {
        cards: cards || [],
        error: null
      };
    } catch (err) {
      console.error('Erro ao buscar cartões disponíveis:', err);
      setError(err.message);
      return {
        cards: [],
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca todos os cartões disponíveis (não vinculados)
   * @param {number} limit - Limite de resultados
   * @returns {Object} { cards, error }
   */
  const getAllAvailableCards = async (limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const { data: cards, error: fetchError } = await supabase
        .from('cards')
        .select(`
          id,
          uuid,
          status,
          created_at,
          batch:card_batches(id, batch_code, description)
        `)
        .eq('status', 'pending')
        .is('client_id', null)
        .eq('is_pre_generated', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return {
        cards: cards || [],
        error: null
      };
    } catch (err) {
      console.error('Erro ao buscar cartões disponíveis:', err);
      setError(err.message);
      return {
        cards: [],
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca informações de um cartão por UUID
   * @param {string} cardUuid - UUID do cartão
   * @returns {Object} { card, error }
   */
  const getCardByUuid = async (cardUuid) => {
    setLoading(true);
    setError(null);

    try {
      const { data: card, error: fetchError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*),
          batch:card_batches(*)
        `)
        .eq('uuid', cardUuid)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            card: null,
            error: 'Cartão não encontrado'
          };
        }
        throw fetchError;
      }

      return {
        card,
        error: null
      };
    } catch (err) {
      console.error('Erro ao buscar cartão:', err);
      setError(err.message);
      return {
        card: null,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    checkCardAvailability,
    bindCardToClient,
    transferCardBalance,
    getAvailableCardsFromBatch,
    getAllAvailableCards,
    getCardByUuid
  };
}

// Made with Bob