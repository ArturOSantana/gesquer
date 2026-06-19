import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { validatePhone, validateEmail, validateCPF } from '@/lib/validators';

/**
 * Hook para gerenciar cartões e clientes
 * Fornece funções CRUD e estado para cartões
 */
export function useCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Busca todos os cartões com informações do cliente
   */
  const fetchCards = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        // Busca por nome ou telefone do cliente
        query = query.or(
          `client.name.ilike.%${filters.search}%,client.phone.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCards(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar cartões:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um cartão específico por UUID
   */
  const getCardByUuid = useCallback(async (uuid) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('uuid', uuid)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar cartão:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um cartão por ID do cliente
   */
  const getCardByClientId = useCallback(async (clientId) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('client_id', clientId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar cartão por cliente:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo cartão com cliente
   */
  const createCard = useCallback(async (clientData) => {
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!clientData.name || clientData.name.trim().length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }

      if (clientData.phone && !validatePhone(clientData.phone)) {
        throw new Error('Telefone inválido');
      }

      if (clientData.email && !validateEmail(clientData.email)) {
        throw new Error('Email inválido');
      }

      if (clientData.cpf && !validateCPF(clientData.cpf)) {
        throw new Error('CPF inválido');
      }

      // Verifica se já existe cliente com mesmo CPF ou telefone
      if (clientData.cpf || clientData.phone) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .or(
            clientData.cpf ? `cpf.eq.${clientData.cpf}` : '',
            clientData.phone ? `phone.eq.${clientData.phone}` : ''
          )
          .single();

        if (existingClient) {
          throw new Error('Já existe um cliente com este CPF ou telefone');
        }
      }

      // Cria o cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name.trim(),
          phone: clientData.phone || null,
          email: clientData.email || null,
          cpf: clientData.cpf || null,
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // Cria o cartão
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert([{
          client_id: client.id,
          balance: clientData.initialBalance || 0,
          status: 'active',
        }])
        .select(`
          *,
          client:clients(*)
        `)
        .single();

      if (cardError) throw cardError;

      // Atualiza lista local
      setCards(prev => [card, ...prev]);

      return { data: card, error: null };
    } catch (err) {
      console.error('Erro ao criar cartão:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza informações do cliente
   */
  const updateCard = useCallback(async (cardId, updates) => {
    setLoading(true);
    setError(null);

    try {
      // Se houver atualizações do cliente
      if (updates.client) {
        const clientUpdates = updates.client;

        // Validações
        if (clientUpdates.name && clientUpdates.name.trim().length < 3) {
          throw new Error('Nome deve ter pelo menos 3 caracteres');
        }

        if (clientUpdates.phone && !validatePhone(clientUpdates.phone)) {
          throw new Error('Telefone inválido');
        }

        if (clientUpdates.email && !validateEmail(clientUpdates.email)) {
          throw new Error('Email inválido');
        }

        if (clientUpdates.cpf && !validateCPF(clientUpdates.cpf)) {
          throw new Error('CPF inválido');
        }

        // Busca o cartão para pegar o client_id
        const { data: card } = await supabase
          .from('cards')
          .select('client_id')
          .eq('id', cardId)
          .single();

        if (!card) throw new Error('Cartão não encontrado');

        // Atualiza o cliente
        const { error: clientError } = await supabase
          .from('clients')
          .update(clientUpdates)
          .eq('id', card.client_id);

        if (clientError) throw clientError;
      }

      // Atualiza o cartão (status, etc)
      if (updates.status) {
        const { error: cardError } = await supabase
          .from('cards')
          .update({ status: updates.status })
          .eq('id', cardId);

        if (cardError) throw cardError;
      }

      // Busca o cartão atualizado
      const { data: updatedCard, error: fetchError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', cardId)
        .single();

      if (fetchError) throw fetchError;

      // Atualiza lista local
      setCards(prev => 
        prev.map(card => card.id === cardId ? updatedCard : card)
      );

      return { data: updatedCard, error: null };
    } catch (err) {
      console.error('Erro ao atualizar cartão:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deleta um cartão (soft delete - marca como inativo)
   */
  const deleteCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);

    try {
      // Verifica se o cartão tem saldo
      const { data: card } = await supabase
        .from('cards')
        .select('balance')
        .eq('id', cardId)
        .single();

      if (card && card.balance > 0) {
        throw new Error('Não é possível deletar cartão com saldo. Transfira o saldo primeiro.');
      }

      // Marca como inativo ao invés de deletar
      const { error: updateError } = await supabase
        .from('cards')
        .update({ status: 'inactive' })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Remove da lista local
      setCards(prev => prev.filter(card => card.id !== cardId));

      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar cartão:', err);
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recarrega saldo do cartão
   */
  const rechargeCard = useCallback(async (cardId, amount) => {
    setLoading(true);
    setError(null);

    try {
      if (amount <= 0) {
        throw new Error('Valor de recarga deve ser maior que zero');
      }

      // Busca saldo atual
      const { data: card } = await supabase
        .from('cards')
        .select('balance, status')
        .eq('id', cardId)
        .single();

      if (!card) throw new Error('Cartão não encontrado');

      if (card.status !== 'active') {
        throw new Error('Cartão não está ativo');
      }

      const newBalance = parseFloat(card.balance) + parseFloat(amount);

      // Atualiza saldo
      const { error: updateError } = await supabase
        .from('cards')
        .update({ balance: newBalance })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // Registra transação de recarga
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          card_id: cardId,
          type: 'recharge',
          amount: amount,
          balance_after: newBalance,
          description: 'Recarga de saldo',
        }]);

      if (transactionError) throw transactionError;

      // Busca cartão atualizado
      const { data: updatedCard } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', cardId)
        .single();

      // Atualiza lista local
      setCards(prev => 
        prev.map(card => card.id === cardId ? updatedCard : card)
      );

      return { data: updatedCard, error: null };
    } catch (err) {
      console.error('Erro ao recarregar cartão:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca transações de um cartão
   */
  const getCardTransactions = useCallback(async (cardId, limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega cartões ao montar o componente
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    fetchCards,
    getCardByUuid,
    getCardByClientId,
    createCard,
    updateCard,
    deleteCard,
    rechargeCard,
    getCardTransactions,
  };
}

// Made with Bob
