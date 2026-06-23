/**
 * Utilitários para processamento de QR Codes
 * Suporta múltiplos formatos de QR Code para retrocompatibilidade
 */

/**
 * Extrai o UUID do cartão de diferentes formatos de QR Code
 *
 * Formatos suportados:
 * 1. URL completa: http://dominio.com/consulta/uuid
 * 2. Formato novo: VENDITOR:uuid
 * 3. Formato legado: QUERMESSE:uuid ou QUERMESSEON:uuid (compatibilidade)
 * 4. UUID puro: uuid
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
  
  // Formato 2: VENDITOR:uuid (formato novo)
  if (content.toUpperCase().startsWith('VENDITOR:')) {
    const uuid = content.substring('VENDITOR:'.length)
    console.log('✓ UUID extraído de formato Venditor:', uuid)
    return uuid
  }
  
  // Formato 3: QUERMESSE:uuid ou QUERMESSEON:uuid (formato legado - compatibilidade)
  if (content.toUpperCase().startsWith('QUERMESSE:')) {
    const uuid = content.substring('QUERMESSE:'.length)
    console.log('✓ UUID extraído de formato legado QUERMESSE:', uuid)
    return uuid
  }
  
  if (content.toUpperCase().startsWith('QUERMESSEON:')) {
    const uuid = content.substring('QUERMESSEON:'.length)
    console.log('✓ UUID extraído de formato legado QUERMESSEON:', uuid)
    return uuid
  }
  
  // Formato 4: UUID puro (validar se parece com UUID)
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
  if (content.toUpperCase().startsWith('VENDITOR:')) return 'formato_venditor'
  if (content.toUpperCase().startsWith('QUERMESSE:')) return 'formato_legado_quermesse'
  if (content.toUpperCase().startsWith('QUERMESSEON:')) return 'formato_legado_quermesseon'
  
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  if (uuidRegex.test(content)) return 'uuid_puro'
  
  return 'desconhecido'
}

/**
 * Gera conteúdo de QR Code no formato Venditor
 * @param {string} cardId - UUID do cartão
 * @returns {string} - Conteúdo formatado para QR Code
 */
export function generateQRCode(cardId) {
  return `VENDITOR:${cardId}`
}

/**
 * Verifica se um QR Code usa formato legado
 * @param {string} qrCodeContent
 * @returns {boolean}
 */
export function isLegacyFormat(qrCodeContent) {
  if (!qrCodeContent) return false
  const content = qrCodeContent.trim().toUpperCase()
  return content.startsWith('QUERMESSE:') || content.startsWith('QUERMESSEON:')
}

// Made with Bob
