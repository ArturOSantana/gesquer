import { useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar idempotência de vendas
 * Previne cobranças duplicadas ao gerar chaves únicas por tentativa
 */
export function useSaleIdempotency() {
  const [currentKey, setCurrentKey] = useState(() => crypto.randomUUID());
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  /**
   * Gera uma nova chave de idempotência
   * Deve ser chamado após cada venda bem-sucedida ou ao iniciar nova venda
   */
  const generateNewKey = useCallback(() => {
    const newKey = crypto.randomUUID();
    setCurrentKey(newKey);
    setProcessing(false);
    processingRef.current = false;
    console.log('Nova chave de idempotência gerada:', newKey);
    return newKey;
  }, []);

  /**
   * Marca o início do processamento
   * Retorna false se já estiver processando (previne cliques duplos)
   */
  const startProcessing = useCallback(() => {
    if (processingRef.current) {
      console.warn('Venda já está sendo processada - ignorando tentativa duplicada');
      return false;
    }
    
    processingRef.current = true;
    setProcessing(true);
    console.log('Iniciando processamento com chave:', currentKey);
    return true;
  }, [currentKey]);

  /**
   * Finaliza o processamento (em caso de erro)
   */
  const finishProcessing = useCallback(() => {
    setProcessing(false);
    processingRef.current = false;
  }, []);

  /**
   * Reseta completamente o estado
   */
  const reset = useCallback(() => {
    generateNewKey();
  }, [generateNewKey]);

  return {
    idempotencyKey: currentKey,
    processing,
    startProcessing,
    finishProcessing,
    generateNewKey,
    reset
  };
}

// Made with Bob
