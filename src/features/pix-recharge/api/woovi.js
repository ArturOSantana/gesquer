/**
 * API Woovi - Integração com gateway de pagamento PIX
 * Taxa: 0,99% por transação
 * Documentação: https://developers.woovi.com
 */

import { supabase } from '@/lib/supabase';

const WOOVI_API_URL = 'https://api.woovi.com/api/v1';
const WOOVI_APP_ID = import.meta.env.VITE_WOOVI_APP_ID;

/**
 * Cria uma cobrança PIX via Woovi
 * @param {Object} params - Parâmetros da cobrança
 * @param {string} params.cardUuid - UUID do cartão
 * @param {number} params.amount - Valor em centavos (ex: 1000 = R$ 10,00)
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerTaxId - CPF do cliente (opcional)
 * @returns {Promise<Object>} Dados da cobrança criada
 */
export async function createPixCharge({ cardUuid, amount, customerName, customerTaxId }) {
  try {
    // Validações
    if (!WOOVI_APP_ID) {
      throw new Error('WOOVI_APP_ID não configurado');
    }

    if (!cardUuid || !amount || !customerName) {
      throw new Error('Parâmetros obrigatórios faltando');
    }

    if (amount < 100) {
      throw new Error('Valor mínimo é R$ 1,00');
    }

    // Chama Edge Function do Supabase que faz a requisição para Woovi
    const { data, error } = await supabase.functions.invoke('create-pix-payment', {
      body: {
        cardUuid,
        amount,
        customerName,
        customerTaxId,
      },
    });

    if (error) {
      console.error('Erro ao criar cobrança PIX:', error);
      throw new Error(error.message || 'Erro ao criar cobrança PIX');
    }

    return data;
  } catch (error) {
    console.error('Erro na API Woovi:', error);
    throw error;
  }
}

/**
 * Consulta status de uma cobrança PIX
 * @param {string} chargeId - ID da cobrança na Woovi
 * @returns {Promise<Object>} Status da cobrança
 */
export async function getChargeStatus(chargeId) {
  try {
    if (!chargeId) {
      throw new Error('chargeId é obrigatório');
    }

    const { data, error } = await supabase.functions.invoke('get-pix-status', {
      body: { chargeId },
    });

    if (error) {
      console.error('Erro ao consultar status:', error);
      throw new Error(error.message || 'Erro ao consultar status');
    }

    return data;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    throw error;
  }
}

/**
 * Cancela uma cobrança PIX pendente
 * @param {string} chargeId - ID da cobrança na Woovi
 * @returns {Promise<Object>} Resultado do cancelamento
 */
export async function cancelCharge(chargeId) {
  try {
    if (!chargeId) {
      throw new Error('chargeId é obrigatório');
    }

    const { data, error } = await supabase.functions.invoke('cancel-pix-payment', {
      body: { chargeId },
    });

    if (error) {
      console.error('Erro ao cancelar cobrança:', error);
      throw new Error(error.message || 'Erro ao cancelar cobrança');
    }

    return data;
  } catch (error) {
    console.error('Erro ao cancelar cobrança:', error);
    throw error;
  }
}

/**
 * Calcula a taxa Woovi (0,99%)
 * @param {number} amount - Valor em centavos
 * @returns {number} Taxa em centavos
 */
export function calculateWooviFee(amount) {
  return Math.ceil(amount * 0.0099);
}

/**
 * Calcula o valor líquido após taxa
 * @param {number} amount - Valor em centavos
 * @returns {number} Valor líquido em centavos
 */
export function calculateNetAmount(amount) {
  const fee = calculateWooviFee(amount);
  return amount - fee;
}

/**
 * Formata valor em centavos para Real
 * @param {number} cents - Valor em centavos
 * @returns {string} Valor formatado (ex: "R$ 10,00")
 */
export function formatCurrency(cents) {
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Valida CPF (formato básico)
 * @param {string} cpf - CPF para validar
 * @returns {boolean}
 */
export function isValidCPF(cpf) {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se não é uma sequência repetida
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  return true;
}

/**
 * Formata CPF
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado (xxx.xxx.xxx-xx)
 */
export function formatCPF(cpf) {
  if (!cpf) return '';
  
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return cpf;
  
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Gera um identificador único para a transação
 * @returns {string}
 */
export function generateTransactionId() {
  return `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se o ambiente está configurado corretamente
 * @returns {Object} Status da configuração
 */
export function checkConfiguration() {
  return {
    configured: !!WOOVI_APP_ID,
    appId: WOOVI_APP_ID ? '***' + WOOVI_APP_ID.slice(-4) : null,
    apiUrl: WOOVI_API_URL,
  };
}

// Made with Bob
