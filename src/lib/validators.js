import { LIMITS } from './constants'

/**
 * Valida valor monetário
 */
export function validateAmount(amount, min = 0, max = Infinity) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Valor deve ser um número' }
  }
  
  if (amount < min) {
    return { valid: false, error: `Valor mínimo é ${min}` }
  }
  
  if (amount > max) {
    return { valid: false, error: `Valor máximo é ${max}` }
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Valor deve ser maior que zero' }
  }
  
  return { valid: true }
}

/**
 * Valida recarga de cartão
 */
export function validateRecharge(amount) {
  return validateAmount(amount, LIMITS.minRechargeAmount)
}

/**
 * Valida transferência
 */
export function validateTransfer(amount, balance) {
  const amountValidation = validateAmount(amount, 0, LIMITS.maxTransferAmount)
  if (!amountValidation.valid) {
    return amountValidation
  }
  
  if (amount > balance) {
    return { valid: false, error: 'Saldo insuficiente' }
  }
  
  return { valid: true }
}

/**
 * Valida venda
 */
export function validateSale(items, balance) {
  if (!items || items.length === 0) {
    return { valid: false, error: 'Carrinho vazio' }
  }
  
  if (items.length > LIMITS.maxCartItems) {
    return { valid: false, error: `Máximo de ${LIMITS.maxCartItems} itens` }
  }
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  if (total > balance) {
    return { valid: false, error: 'Saldo insuficiente' }
  }
  
  return { valid: true, total }
}

/**
 * Valida quantidade de estoque
 */
export function validateStockQuantity(quantity, available) {
  if (typeof quantity !== 'number' || quantity <= 0) {
    return { valid: false, error: 'Quantidade inválida' }
  }
  
  if (quantity > available) {
    return { valid: false, error: 'Quantidade indisponível em estoque' }
  }
  
  return { valid: true }
}

/**
 * Valida código do cartão
 */
export function validateCardCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código inválido' }
  }
  
  const trimmedCode = code.trim()
  
  if (trimmedCode.length < 3) {
    return { valid: false, error: 'Código muito curto' }
  }
  
  if (trimmedCode.length > 50) {
    return { valid: false, error: 'Código muito longo' }
  }
  
  return { valid: true, code: trimmedCode }
}

/**
 * Valida nome
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome inválido' }
  }
  
  const trimmedName = name.trim()
  
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Nome muito curto' }
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Nome muito longo' }
  }
  
  return { valid: true, name: trimmedName }
}

/**
 * Valida email
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email inválido' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' }
  }
  
  return { valid: true, email: email.toLowerCase().trim() }
}

/**
 * Valida telefone
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Telefone inválido' }
  }
  
  const cleanPhone = phone.replace(/[^\d]/g, '')
  
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return { valid: false, error: 'Telefone deve ter 10 ou 11 dígitos' }
  }
  
  return { valid: true, phone: cleanPhone }
}

/**
 * Valida CPF
 */
export function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, error: 'CPF inválido' }
  }
  
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 dígitos' }
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, error: 'CPF inválido' }
  }
  
  // Valida primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  let digit1 = remainder >= 10 ? 0 : remainder
  
  if (digit1 !== parseInt(cleanCPF.charAt(9))) {
    return { valid: false, error: 'CPF inválido' }
  }
  
  // Valida segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  let digit2 = remainder >= 10 ? 0 : remainder
  
  if (digit2 !== parseInt(cleanCPF.charAt(10))) {
    return { valid: false, error: 'CPF inválido' }
  }
  
  return { valid: true, cpf: cleanCPF }
}

/**
 * Valida produto
 */
export function validateProduct(product) {
  const errors = []
  
  if (!product.name || product.name.trim().length < 2) {
    errors.push('Nome do produto inválido')
  }
  
  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.push('Preço inválido')
  }
  
  if (typeof product.stock !== 'number' || product.stock < 0) {
    errors.push('Estoque inválido')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true }
}

/**
 * Valida barraca
 */
export function validateBarraca(barraca) {
  const errors = []
  
  if (!barraca.name || barraca.name.trim().length < 2) {
    errors.push('Nome da barraca inválido')
  }
  
  if (!barraca.responsible || barraca.responsible.trim().length < 2) {
    errors.push('Nome do responsável inválido')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true }
}

/**
 * Valida filtros de data
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Datas inválidas' }
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Formato de data inválido' }
  }
  
  if (start > end) {
    return { valid: false, error: 'Data inicial deve ser anterior à data final' }
  }
  
  return { valid: true }
}

/**
 * Sanitiza entrada de texto
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Valida UUID
 */
export function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Made with Bob
