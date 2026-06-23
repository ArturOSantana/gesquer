/**
 * Tipos de eventos suportados pelo sistema
 * Usado para categorizar eventos e personalizar a experiência do usuário
 */

export const EVENT_TYPES = [
  { value: 'quermesse', label: 'Quermesse / Festa Junina', icon: '🎪' },
  { value: 'novena', label: 'Novena / Evento Religioso', icon: '⛪' },
  { value: 'cantina', label: 'Cantina Recorrente', icon: '🍽️' },
  { value: 'festival', label: 'Festival / Show', icon: '🎵' },
  { value: 'corporativo', label: 'Evento Corporativo', icon: '🏢' },
  { value: 'escola', label: 'Festa Escolar', icon: '🎓' },
  { value: 'beneficente', label: 'Evento Beneficente', icon: '❤️' },
  { value: 'feira', label: 'Feira Gastronômica', icon: '🍴' },
  { value: 'outro', label: 'Outro', icon: '📅' }
]

/**
 * Retorna o label de um tipo de evento
 * @param {string} type - Valor do tipo de evento
 * @returns {string} Label do tipo de evento
 */
export const getEventTypeLabel = (type) => {
  const eventType = EVENT_TYPES.find(t => t.value === type)
  return eventType ? eventType.label : type
}

/**
 * Retorna o ícone de um tipo de evento
 * @param {string} type - Valor do tipo de evento
 * @returns {string} Ícone do tipo de evento
 */
export const getEventTypeIcon = (type) => {
  const eventType = EVENT_TYPES.find(t => t.value === type)
  return eventType ? eventType.icon : '📅'
}

/**
 * Retorna o objeto completo de um tipo de evento
 * @param {string} type - Valor do tipo de evento
 * @returns {object|null} Objeto do tipo de evento ou null
 */
export const getEventType = (type) => {
  return EVENT_TYPES.find(t => t.value === type) || null
}

// Made with Bob
