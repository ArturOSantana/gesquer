/**
 * Utilitários para processamento de QR Codes
 * Suporta múltiplos formatos de QR Code para retrocompatibilidade
 */

/**
 * Extrai o UUID do cartão de diferentes formatos de QR Code
 * 
 * Formatos suportados:
 * 1. URL completa: http://dominio.com/consulta/uuid
 * 2. Formato antigo: QUERMESSEON:uuid
 * 3. UUID puro: uuid
 * 
 * @param {string} qrCodeContent - Conteúdo lido do QR Code
 * @returns {string|null} - UUID extraído ou null se inválido
 */
export function extractUuidFromQrCode(qrCodeContent) {
  if (!qrCodeContent || typeof qrCodeContent !== 'string') {
    console.warn('QR Code inválido: conteúdo vazio ou não é string')
    return null
  }

  const content = qrCodeContent.trim()
  
  // Formato 1: URL completa (http://dominio.com/consulta/uuid)
  if (content.includes('/consulta/')) {
    const match = content.match(/\/consulta\/([a-f0-9-]+)$/i)
    if (match && match[1]) {
      console.log('✓ UUID extraído de URL completa:', match[1])
      return match[1]
    }
  }
  
  // Formato 2: QUERMESSEON:uuid (formato antigo)
  if (content.toUpperCase().startsWith('QUERMESSEON:')) {
    const uuid = content.substring('QUERMESSEON:'.length)
    console.log('✓ UUID extraído de formato antigo:', uuid)
    return uuid
  }
  
  // Formato 3: UUID puro (validar se parece com UUID)
  // UUID tem formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (uuidRegex.test(content)) {
    console.log('✓ UUID puro reconhecido:', content)
    return content
  }
  
  // Se não reconheceu nenhum formato, retorna null
  console.warn('❌ Formato de QR Code não reconhecido:', content)
  return null
}

/**
 * Valida se o conteúdo do QR Code é válido
 * @param {string} qrCodeContent 
 * @returns {boolean}
 */
export function isValidQrCode(qrCodeContent) {
  return extractUuidFromQrCode(qrCodeContent) !== null
}

/**
 * Formata o conteúdo do QR Code para debug
 * @param {string} qrCodeContent 
 * @returns {object}
 */
export function debugQrCode(qrCodeContent) {
  const uuid = extractUuidFromQrCode(qrCodeContent)
  
  return {
    original: qrCodeContent,
    uuid: uuid,
    isValid: uuid !== null,
    detectedFormat: detectFormat(qrCodeContent)
  }
}

/**
 * Detecta o formato do QR Code
 * @param {string} qrCodeContent 
 * @returns {string}
 */
function detectFormat(qrCodeContent) {
  if (!qrCodeContent) return 'invalid'
  
  const content = qrCodeContent.trim()
  
  if (content.includes('/consulta/')) return 'url_completa'
  if (content.toUpperCase().startsWith('QUERMESSEON:')) return 'formato_antigo'
  
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (uuidRegex.test(content)) return 'uuid_puro'
  
  return 'desconhecido'
}

// Made with Bob
