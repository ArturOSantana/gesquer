import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar lotes de cartões pré-gerados
 */
export function useBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Gera um novo lote de cartões
   */
  const generateBatch = async (quantity, description = '', generatedBy = 'Admin') => {
    setLoading(true);
    setError(null);

    try {
      // Gera código único do lote
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const batchCode = `BATCH-${timestamp}-${random}`;

      // Cria o lote
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

      // Gera os cartões do lote
      const cards = [];
      for (let i = 0; i < quantity; i++) {
        cards.push({
          batch_id: batch.id,
          is_pre_generated: true,
          status: 'pending',
          balance: 0
        });
      }

      // Insere todos os cartões de uma vez
      const { data: generatedCards, error: cardsError } = await supabase
        .from('cards')
        .insert(cards)
        .select('id, uuid, batch_id, created_at');

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

      // Aplica filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return {
        success: true,
        batches: data
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
      // Busca o lote
      const { data: batch, error: batchError } = await supabase
        .from('card_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;

      // Busca os cartões do lote
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('id, uuid, status, balance, activated_at, created_at')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;

      return {
        success: true,
        batch,
        cards
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
      // Cabeçalho do CSV
      const headers = ['ID', 'UUID', 'QR Code', 'Status', 'Criado em'];
      
      // Linhas de dados
      const rows = cards.map(card => [
        card.id,
        card.uuid,
        `QUERMESSEON:${card.uuid}`,
        card.status,
        new Date(card.created_at).toLocaleString('pt-BR')
      ]);

      // Monta o CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Cria o blob e faz download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${batch.batch_code}_cartoes.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
          code: batch.batch_code,
          quantity: batch.quantity,
          description: batch.description,
          created_at: batch.created_at
        },
        cards: cards.map(card => ({
          id: card.id,
          uuid: card.uuid,
          qr_code: `QUERMESSEON:${card.uuid}`,
          status: card.status,
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

      return { success: true };
    } catch (err) {
      console.error('Erro ao exportar JSON:', err);
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
      // Atualiza status do lote
      const { error: batchError } = await supabase
        .from('card_batches')
        .update({ status: 'cancelled' })
        .eq('id', batchId);

      if (batchError) throw batchError;

      // Atualiza status dos cartões não ativados
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
    cancelBatch
  };
}

// Made with Bob
