/**
 * Export central da feature PIX Recharge
 * Permite importar componentes de forma limpa e condicional
 */

import { FEATURES } from '@/lib/features';

// Imports condicionais usando ES6 modules
import { PixRechargeButton as PixRechargeButtonComponent } from './components/PixRechargeButton';
import { PixRechargeModal as PixRechargeModalComponent } from './components/PixRechargeModal';
import { RecarregarPix as RecarregarPixComponent } from './pages/RecarregarPix';
import { usePixPayment as usePixPaymentHook, usePixTransactions as usePixTransactionsHook, PIX_STATUS as PIX_STATUS_CONST } from './hooks/usePixPayment';
import * as wooviApiModule from './api/woovi';

// Exports condicionais - só exporta se feature estiver ativa
export const PixRechargeButton = FEATURES.PIX_RECHARGE
  ? PixRechargeButtonComponent
  : () => null;

export const PixRechargeModal = FEATURES.PIX_RECHARGE
  ? PixRechargeModalComponent
  : () => null;

export const RecarregarPix = FEATURES.PIX_RECHARGE
  ? RecarregarPixComponent
  : () => null;

// Exports de hooks
export const usePixPayment = FEATURES.PIX_RECHARGE
  ? usePixPaymentHook
  : () => ({
      status: 'disabled',
      charge: null,
      error: 'Feature PIX desativada',
      loading: false,
    });

export const usePixTransactions = FEATURES.PIX_RECHARGE
  ? usePixTransactionsHook
  : () => ({
      transactions: [],
      loading: false,
      error: 'Feature PIX desativada',
    });

// Exports de API
export const wooviApi = FEATURES.PIX_RECHARGE
  ? wooviApiModule
  : {
      createPixCharge: () => Promise.reject('Feature PIX desativada'),
      getChargeStatus: () => Promise.reject('Feature PIX desativada'),
      cancelCharge: () => Promise.reject('Feature PIX desativada'),
      calculateWooviFee: () => 0,
      calculateNetAmount: (amount) => amount,
      formatCurrency: (cents) => `R$ ${(cents / 100).toFixed(2)}`,
    };

// Export de constantes
export const PIX_STATUS = FEATURES.PIX_RECHARGE
  ? PIX_STATUS_CONST
  : {
      IDLE: 'idle',
      DISABLED: 'disabled',
    };

/**
 * Verifica se a feature PIX está ativa
 * @returns {boolean}
 */
export const isPixEnabled = () => FEATURES.PIX_RECHARGE === true;

/**
 * Componente wrapper que só renderiza se PIX estiver ativo
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} props.fallback
 */
export const PixFeatureWrapper = ({ children, fallback = null }) => {
  return FEATURES.PIX_RECHARGE ? children : fallback;
};

// Made with Bob
