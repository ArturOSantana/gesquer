/**
 * Utilitários de criptografia client-side
 * Nota: A criptografia AES-256 real é feita no Supabase com pgcrypto
 * Aqui fazemos apenas hash para comparação e validação
 */

/**
 * Obtém a API de criptografia do navegador
 */
function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto
  }
  if (typeof crypto !== 'undefined') {
    return crypto
  }
  throw new Error('Web Crypto API não disponível')
}

/**
 * Gera hash SHA-256 de um CPF para comparação
 * Usado para validar CPF sem enviar o valor em texto plano
 */
export async function hashCPF(cpf) {
  if (!cpf) return null
  
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos')
  }
  
  // Converte para ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(cleanCPF)
  
  // Gera hash SHA-256
  const cryptoAPI = getCrypto()
  const hashBuffer = await cryptoAPI.subtle.digest('SHA-256', data)
  
  // Converte para hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Gera hash SHA-256 de uma string genérica
 */
export async function hashString(str) {
  if (!str) return null
  
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const cryptoAPI = getCrypto()
  const hashBuffer = await cryptoAPI.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Gera um salt aleatório para uso em hashing
 */
export function generateSalt(length = 16) {
  const array = new Uint8Array(length)
  const cryptoAPI = getCrypto()
  cryptoAPI.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Mascara CPF para exibição segura (XXX.XXX.XXX-XX -> XXX.XXX.XXX-**)
 */
export function maskCPF(cpf) {
  if (!cpf) return ''
  
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length !== 11) return cpf
  
  // Mostra apenas os primeiros 9 dígitos, mascara os 2 últimos
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-**')
}

/**
 * Mascara telefone para exibição segura ((11) 99999-9999 -> (11) 9****-9999)
 */
export function maskPhone(phone) {
  if (!phone) return ''
  
  const cleanPhone = phone.replace(/[^\d]/g, '')
  
  if (cleanPhone.length === 11) {
    // Celular: (11) 9****-9999
    return cleanPhone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2****-$4')
  } else if (cleanPhone.length === 10) {
    // Fixo: (11) ****-9999
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) ****-$3')
  }
  
  return phone
}

/**
 * Mascara email para exibição segura (user@example.com -> u***@example.com)
 */
export function maskEmail(email) {
  if (!email) return ''
  
  const [localPart, domain] = email.split('@')
  
  if (!domain) return email
  
  const maskedLocal = localPart.charAt(0) + '***'
  
  return `${maskedLocal}@${domain}`
}

/**
 * Valida se o navegador suporta Web Crypto API
 */
export function isCryptoSupported() {
  try {
    const cryptoAPI = getCrypto()
    return typeof cryptoAPI !== 'undefined' &&
           typeof cryptoAPI.subtle !== 'undefined' &&
           typeof cryptoAPI.getRandomValues !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Gera um ID único usando crypto.randomUUID (se disponível)
 */
export function generateSecureId() {
  try {
    const cryptoAPI = getCrypto()
    if (typeof cryptoAPI.randomUUID === 'function') {
      return cryptoAPI.randomUUID()
    }
  } catch {
    // Fallback se crypto não disponível
  }
  
  // Fallback para navegadores antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Compara dois hashes de forma segura (timing-safe)
 */
export function secureCompare(a, b) {
  if (!a || !b) return false
  
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Sanitiza dados sensíveis antes de enviar para logs
 */
export function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') return data
  
  const sanitized = { ...data }
  
  // Lista de campos sensíveis que devem ser mascarados
  const sensitiveFields = ['cpf', 'password', 'token', 'secret', 'key']
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***'
    }
  }
  
  // Mascara CPF se presente
  if (sanitized.cpf && typeof sanitized.cpf === 'string') {
    sanitized.cpf = maskCPF(sanitized.cpf)
  }
  
  // Mascara telefone se presente
  if (sanitized.phone && typeof sanitized.phone === 'string') {
    sanitized.phone = maskPhone(sanitized.phone)
  }
  
  // Mascara email se presente
  if (sanitized.email && typeof sanitized.email === 'string') {
    sanitized.email = maskEmail(sanitized.email)
  }
  
  return sanitized
}

/**
 * Valida força de senha (se necessário no futuro)
 */
export function validatePasswordStrength(password) {
  if (!password) {
    return { valid: false, strength: 'none', error: 'Senha não pode ser vazia' }
  }
  
  const length = password.length
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  let strength = 0
  
  if (length >= 8) strength++
  if (length >= 12) strength++
  if (hasUpperCase) strength++
  if (hasLowerCase) strength++
  if (hasNumbers) strength++
  if (hasSpecialChar) strength++
  
  if (strength < 3) {
    return { valid: false, strength: 'weak', error: 'Senha muito fraca' }
  } else if (strength < 5) {
    return { valid: true, strength: 'medium' }
  } else {
    return { valid: true, strength: 'strong' }
  }
}

// Made with Bob