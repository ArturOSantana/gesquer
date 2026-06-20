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
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf) {
  if (!cpf) return ''
  
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) return cpf
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Remove formatação do CPF, retorna apenas números
 */
export function sanitizeCPF(cpf) {
  if (!cpf) return ''
  return cpf.replace(/[^\d]/g, '')
}

/**
 * Valida data de nascimento
 */
export function validateBirthDate(birthDate) {
  if (!birthDate) {
    return { valid: false, error: 'Data de nascimento inválida' }
  }
  
  const date = new Date(birthDate)
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Formato de data inválido' }
  }
  
  const today = new Date()
  const minDate = new Date(1900, 0, 1)
  
  if (date < minDate || date > today) {
    return { valid: false, error: 'Data de nascimento inválida' }
  }
  
  return { valid: true, date }
}

/**
 * Verifica se é menor de idade (< 18 anos)
 */
export function isMinor(birthDate) {
  if (!birthDate) return false
  
  const birth = new Date(birthDate)
  const today = new Date()
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age < 18
}

/**
 * Valida dados de cliente para recuperação
 */
export function validateClientRecovery(data) {
  const errors = []
  
  // Telefone obrigatório
  const phoneValidation = validatePhone(data.phone)
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.error)
  }
  
  // Nome obrigatório
  const nameValidation = validateName(data.name)
  if (!nameValidation.valid) {
    errors.push(nameValidation.error)
  }
  
  // CPF opcional, mas se fornecido deve ser válido
  if (data.cpf) {
    const cpfValidation = validateCPF(data.cpf)
    if (!cpfValidation.valid) {
      errors.push(cpfValidation.error)
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true }
}

/**
 * Valida dados de cliente para cadastro com CPF
 */
export function validateClientWithCPF(data) {
  const errors = []
  
  // Validações básicas
  const nameValidation = validateName(data.name)
  if (!nameValidation.valid) {
    errors.push(nameValidation.error)
  }
  
  const phoneValidation = validatePhone(data.phone)
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.error)
  }
  
  // CPF opcional
  if (data.cpf) {
    const cpfValidation = validateCPF(data.cpf)
    if (!cpfValidation.valid) {
      errors.push(cpfValidation.error)
    }
  }
  
  // Data de nascimento opcional
  if (data.birthDate) {
    const birthDateValidation = validateBirthDate(data.birthDate)
    if (!birthDateValidation.valid) {
      errors.push(birthDateValidation.error)
    }
  }
  
  // Se é menor, nome do responsável é obrigatório
  if (data.isMinor && (!data.guardianName || data.guardianName.trim().length < 2)) {
    errors.push('Nome do responsável é obrigatório para menores de idade')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true }
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
