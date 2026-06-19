import { useState } from 'react';
import { supabase } from '../lib/supabase';

const QR_PREFIX = 'QUERMESSEON:';

function formatBatchCreator(batch, usersMap) {
  if (!batch?.generated_by) return 'Não informado';
  return usersMap[batch.generated_by]?.name || batch.generated_by;
}

function normalizeBatch(batch, usersMap = {}) {
  const cardsCount = Array.isArray(batch.cards) && batch.cards[0]?.count !== undefined
    ? batch.cards[0].count
    : batch.quantity;

  return {
    ...batch,
    cards_count: cardsCount,
    creator_name: formatBatchCreator(batch, usersMap),
  };
}

function getCardStatusLabel(status, clientName) {
  if (status === 'active' && clientName) return `Vinculado: ${clientName}`;
  if (status === 'pending') return 'Não vinculado';
  if (status === 'inactive') return 'Inativo';
  if (status === 'blocked') return 'Bloqueado';
  return status || 'Desconhecido';
}

/**
 * Hook para gerenciar lotes de cartões pré-gerados
 */
export function useBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsersMap = async () => {
    const { data, error: usersError } = await supabase
      .from('users')
      .select('id, name');

    if (usersError) throw usersError;

    return (data || []).reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  };

  /**
   * Gera um novo lote de cartões
   */
  const generateBatch = async (quantity, description = '', generatedBy = 'Admin') => {
    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const batchCode = `BATCH-${timestamp}-${random}`;

      const { data: batch, error: batchError } = await supabase
        .from('card_batches')
        .insert({
          batch_code: batchCode,
          quantity,
          description,
          generated_by: generatedBy,
          status: 'active'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      const cards = Array.from({ length: quantity }, () => ({
        batch_id: batch.id,
        is_pre_generated: true,
        status: 'pending',
        balance: 0
      }));

      const { data: generatedCards, error: cardsError } = await supabase
        .from('cards')
        .insert(cards)
        .select('id, uuid, batch_id, created_at, status, balance');

      if (cardsError) throw cardsError;

      return {
        success: true,
        batch,
        cards: generatedCards
      };
    } catch (err) {
      console.error('Erro ao gerar lote:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca todos os lotes
   */
  const getBatches = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('card_batches')
        .select(`
          *,
          cards:cards(count)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.createdBy) {
        query = query.ilike('generated_by', `%${filters.createdBy}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', `${filters.dateFrom}T00:00:00`);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
      }

      const [{ data, error: fetchError }, usersMap] = await Promise.all([
        query,
        loadUsersMap()
      ]);

      if (fetchError) throw fetchError;

      return {
        success: true,
        batches: (data || []).map((batch) => normalizeBatch(batch, usersMap))
      };
    } catch (err) {
      console.error('Erro ao buscar lotes:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca um lote específico com seus cartões
   */
  const getBatchDetails = async (batchId) => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: batch, error: batchError }, { data: cards, error: cardsError }, usersMap] = await Promise.all([
        supabase
          .from('card_batches')
          .select('*')
          .eq('id', batchId)
          .single(),
        supabase
          .from('cards')
          .select(`
            id,
            uuid,
            status,
            balance,
            activated_at,
            created_at,
            updated_at,
            client_id,
            clients:client_id (
              id,
              name
            )
          `)
          .eq('batch_id', batchId)
          .order('created_at', { ascending: true }),
        loadUsersMap()
      ]);

      if (batchError) throw batchError;
      if (cardsError) throw cardsError;

      const normalizedBatch = normalizeBatch(batch, usersMap);
      const normalizedCards = (cards || []).map((card) => {
        const clientName = card.clients?.name || null;

        return {
          ...card,
          qr_value: `${QR_PREFIX}${card.uuid}`,
          client_name: clientName,
          binding_status_label: getCardStatusLabel(card.status, clientName),
          is_bound: Boolean(clientName),
        };
      });

      return {
        success: true,
        batch: normalizedBatch,
        cards: normalizedCards
      };
    } catch (err) {
      console.error('Erro ao buscar detalhes do lote:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exporta lote em formato CSV
   */
  const exportBatchCSV = (batch, cards) => {
    try {
      const headers = ['ID', 'UUID', 'QR Code', 'Status', 'Cliente', 'Criado em'];

      const rows = cards.map(card => [
        card.id,
        card.uuid,
        `${QR_PREFIX}${card.uuid}`,
        card.status,
        card.client_name || '',
        new Date(card.created_at).toLocaleString('pt-BR')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${batch.batch_code}_cartoes.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  /**
   * Exporta lote em formato JSON
   */
  const exportBatchJSON = (batch, cards) => {
    try {
      const data = {
        batch: {
          id: batch.id,
          code: batch.batch_code,
          quantity: batch.quantity,
          description: batch.description,
          created_at: batch.created_at,
          generated_by: batch.generated_by,
          creator_name: batch.creator_name
        },
        cards: cards.map(card => ({
          id: card.id,
          uuid: card.uuid,
          qr_code: `${QR_PREFIX}${card.uuid}`,
          status: card.status,
          client_name: card.client_name,
          created_at: card.created_at
        }))
      };

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${batch.batch_code}_cartoes.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      console.error('Erro ao exportar JSON:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  const printBatch = (batch) => {
    try {
      document.title = `Lote ${batch.batch_code}`;
      window.print();
      return { success: true };
    } catch (err) {
      console.error('Erro ao imprimir lote:', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  /**
   * Cancela um lote
   */
  const cancelBatch = async (batchId) => {
    setLoading(true);
    setError(null);

    try {
      const { error: batchError } = await supabase
        .from('card_batches')
        .update({ status: 'cancelled' })
        .eq('id', batchId);

      if (batchError) throw batchError;

      const { error: cardsError } = await supabase
        .from('cards')
        .update({ status: 'inactive' })
        .eq('batch_id', batchId)
        .eq('status', 'pending');

      if (cardsError) throw cardsError;

      return { success: true };
    } catch (err) {
      console.error('Erro ao cancelar lote:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateBatch,
    getBatches,
    getBatchDetails,
    exportBatchCSV,
    exportBatchJSON,
    printBatch,
    cancelBatch
  };
}

// Made with Bob
