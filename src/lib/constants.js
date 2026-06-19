// Configurações da aplicação
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Sistema de Quermesse',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
}

// Limites
export const LIMITS = {
  maxCartItems: parseInt(import.meta.env.VITE_MAX_CART_ITEMS) || 50,
  maxTransferAmount: parseFloat(import.meta.env.VITE_MAX_TRANSFER_AMOUNT) || 1000,
  minRechargeAmount: parseFloat(import.meta.env.VITE_MIN_RECHARGE_AMOUNT) || 10,
}

// Perfis de usuário
export const USER_ROLES = {
  ADMIN: 'admin',
  CAIXA: 'caixa',
  BARRACA: 'barraca',
}

// Tipos de transação
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  RECHARGE: 'recharge',
  TRANSFER: 'transfer',
}

// Status de transação
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

// Status de estoque
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
}

// Limites de estoque
export const STOCK_LIMITS = {
  lowStockThreshold: 10,
  criticalStockThreshold: 5,
}

// Mensagens de erro
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  CARD_NOT_FOUND: 'Cartão não encontrado',
  INVALID_AMOUNT: 'Valor inválido',
  STOCK_UNAVAILABLE: 'Produto indisponível',
  NETWORK_ERROR: 'Erro de conexão',
  UNKNOWN_ERROR: 'Erro desconhecido',
}

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  SALE_COMPLETED: 'Venda realizada com sucesso',
  RECHARGE_COMPLETED: 'Recarga realizada com sucesso',
  TRANSFER_COMPLETED: 'Transferência realizada com sucesso',
  CARD_CREATED: 'Cartão criado com sucesso',
  STOCK_UPDATED: 'Estoque atualizado com sucesso',
}

// Formato de moeda
export const CURRENCY_FORMAT = {
  locale: 'pt-BR',
  currency: 'BRL',
}

// Configurações de paginação
export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
}

// Configurações de QR Code
export const QR_CONFIG = {
  width: 256,
  height: 256,
  margin: 2,
  errorCorrectionLevel: 'M',
}

// Rotas da aplicação
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SCAN_CARD: '/scan',
  CARD_BALANCE: '/balance/:cardId',
  SALE: '/sale',
  STOCK: '/stock',
  TRANSFER: '/transfer',
  HISTORY: '/history',
  BARRACAS: '/barracas',
  CARDS: '/cards',
  REPORTS: '/reports',
}

// Made with Bob
