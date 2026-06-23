/**
 * Feature Flags - Controle centralizado de funcionalidades
 * 
 * Para desativar uma feature, basta:
 * 1. Mudar o valor para false
 * 2. Comentar a linha
 * 3. Deletar a pasta da feature
 */

export const FEATURES = {
  /**
   * PIX_RECHARGE - Sistema de recarga automática via PIX (Woovi)
   * 
   * Quando ativado:
   * - Botão de recarga PIX aparece na consulta de saldo
   * - Rota /recarregar-pix/:uuid fica disponível
   * - Integração com Woovi para gerar QR codes
   * - Webhook para confirmação automática de pagamento
   * 
   * Para desativar:
   * - Mude para false ou comente esta linha
   * - Sistema continua funcionando normalmente
   * - Recarga manual via caixa continua disponível
   */
  PIX_RECHARGE: true,
};

/**
 * Helper para verificar se uma feature está ativa
 * @param {string} featureName - Nome da feature
 * @returns {boolean}
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURES[featureName] === true;
};

/**
 * Helper para obter configuração de feature
 * @param {string} featureName - Nome da feature
 * @param {*} defaultValue - Valor padrão se feature não existir
 * @returns {*}
 */
export const getFeatureConfig = (featureName, defaultValue = false) => {
  return FEATURES[featureName] ?? defaultValue;
};

// Made with Bob
