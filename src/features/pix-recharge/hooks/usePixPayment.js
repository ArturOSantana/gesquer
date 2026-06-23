/**
 * Hook customizado para gerenciar pagamentos PIX
 * Encapsula toda a lógica de criação, monitoramento e confirmação de pagamentos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  createPixCharge,
  getChargeStatus,
  cancelCharge,
  calculateWooviFee,
  calculateNetAmount,
} from '../api/woovi';

/**
 * Estados possíveis do pagamento PIX
 */
export const PIX_STATUS = {
  IDLE: 'idle',
  CREATING: 'creating',
  PENDING: 'pending',
  POLLING: 'polling',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  ERROR: 'error',
};

/**
 * Hook para gerenciar pagamento PIX
 * @param {Object} options - Opções do hook
 * @param {string} options.cardUuid - UUID do cartão
 * @param {Function} options.onSuccess - Callback de sucesso
 * @param {Function} options.onError - Callback de erro
 * @returns {Object} Estado e funções do pagamento
 */
export function usePixPayment({ cardUuid, onSuccess, onError } = {}) {
  const [status, setStatus] = useState(PIX_STATUS.IDLE);
  const [charge, setCharge] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  
  const pollingIntervalRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  /**
   * Limpa recursos (polling e realtime)
   */
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  /**
   * Cria uma nova cobrança PIX
   */
  const createCharge = useCallback(async ({ amount, customerName, customerTaxId }) => {
    try {
      setLoading(true);
      setStatus(PIX_STATUS.CREATING);
      setError(null);

      const chargeData = await createPixCharge({
        cardUuid,
        amount,
        customerName,
        customerTaxId,
      });

      setCharge(chargeData);
      setStatus(PIX_STATUS.PENDING);
      
      return chargeData;
    } catch (err) {
      console.error('Erro ao criar cobrança:', err);
      setError(err.message);
      setStatus(PIX_STATUS.ERROR);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardUuid, onError]);

  /**
   * Inicia monitoramento via polling (fallback)
   */
  const startPolling = useCallback((chargeId) => {
    if (pollingIntervalRef.current) return;

    setStatus(PIX_STATUS.POLLING);
    setPollingCount(0);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        setPollingCount(prev => prev + 1);
        
        const statusData = await getChargeStatus(chargeId);
        
        if (statusData.status === 'COMPLETED') {
          cleanup();
          setStatus(PIX_STATUS.COMPLETED);
          onSuccess?.(statusData);
        } else if (statusData.status === 'EXPIRED') {
          cleanup();
          setStatus(PIX_STATUS.EXPIRED);
        } else if (statusData.status === 'CANCELLED') {
          cleanup();
          setStatus(PIX_STATUS.CANCELLED);
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        // Continua tentando...
      }
    }, 5000); // Verifica a cada 5 segundos
  }, [cleanup, onSuccess]);

  /**
   * Inicia monitoramento via Realtime (preferencial)
   */
  const startRealtimeMonitoring = useCallback((transactionId) => {
    if (realtimeChannelRef.current) return;

    const channel = supabase
      .channel(`pix-payment-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pix_transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          const { status: newStatus } = payload.new;
          
          if (newStatus === 'completed') {
            cleanup();
            setStatus(PIX_STATUS.COMPLETED);
            setCharge(prev => ({ ...prev, status: 'COMPLETED' }));
            onSuccess?.(payload.new);
          } else if (newStatus === 'expired') {
            cleanup();
            setStatus(PIX_STATUS.EXPIRED);
            setCharge(prev => ({ ...prev, status: 'EXPIRED' }));
          } else if (newStatus === 'cancelled') {
            cleanup();
            setStatus(PIX_STATUS.CANCELLED);
            setCharge(prev => ({ ...prev, status: 'CANCELLED' }));
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [cleanup, onSuccess]);

  /**
   * Cancela a cobrança atual
   */
  const cancel = useCallback(async () => {
    if (!charge?.chargeId) return;

    try {
      setLoading(true);
      await cancelCharge(charge.chargeId);
      cleanup();
      setStatus(PIX_STATUS.CANCELLED);
    } catch (err) {
      console.error('Erro ao cancelar cobrança:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [charge, cleanup]);

  /**
   * Reseta o estado do hook
   */
  const reset = useCallback(() => {
    cleanup();
    setStatus(PIX_STATUS.IDLE);
    setCharge(null);
    setError(null);
    setLoading(false);
    setPollingCount(0);
  }, [cleanup]);

  /**
   * Calcula informações de taxa
   */
  const getFeeInfo = useCallback((amount) => {
    const fee = calculateWooviFee(amount);
    const netAmount = calculateNetAmount(amount);
    
    return {
      grossAmount: amount,
      fee,
      netAmount,
      feePercentage: 0.99,
    };
  }, []);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Inicia monitoramento quando cobrança é criada
   */
  useEffect(() => {
    if (charge?.chargeId && status === PIX_STATUS.PENDING) {
      // Tenta usar Realtime primeiro
      if (charge.transactionId) {
        startRealtimeMonitoring(charge.transactionId);
      }
      
      // Inicia polling como fallback
      startPolling(charge.chargeId);
    }
  }, [charge, status, startPolling, startRealtimeMonitoring]);

  return {
    // Estado
    status,
    charge,
    error,
    loading,
    pollingCount,
    
    // Flags de estado
    isIdle: status === PIX_STATUS.IDLE,
    isCreating: status === PIX_STATUS.CREATING,
    isPending: status === PIX_STATUS.PENDING,
    isPolling: status === PIX_STATUS.POLLING,
    isCompleted: status === PIX_STATUS.COMPLETED,
    isExpired: status === PIX_STATUS.EXPIRED,
    isCancelled: status === PIX_STATUS.CANCELLED,
    hasError: status === PIX_STATUS.ERROR,
    
    // Ações
    createCharge,
    cancel,
    reset,
    getFeeInfo,
  };
}

/**
 * Hook para listar transações PIX de um cartão
 * @param {string} cardUuid - UUID do cartão
 * @returns {Object} Lista de transações e estado
 */
export function usePixTransactions(cardUuid) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!cardUuid) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('card_uuid', cardUuid)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cardUuid]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

// Made with Bob
