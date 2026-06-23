import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '../contexts/OrganizationContext'
import { supabase } from '../lib/supabase'

/**
 * Hook para gerenciar assinaturas e verificar limites de uso
 * @returns {Object} Dados da assinatura e funções de verificação
 */
export function useSubscription() {
  const { currentOrganization } = useOrganization()
  const [subscription, setSubscription] = useState(null)
  const [plan, setPlan] = useState(null)
  const [limits, setLimits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Carrega assinatura e plano da organização atual
   */
  const loadSubscription = useCallback(async () => {
    if (!currentOrganization?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar assinatura com informações do plano
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions_with_plan')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single()

      if (subError) {
        // Se não encontrou assinatura, pode ser que ainda não foi criada
        if (subError.code === 'PGRST116') {
          console.warn('Organização sem assinatura:', currentOrganization.id)
          setSubscription(null)
          setPlan(null)
          setLimits(null)
        } else {
          throw subError
        }
      } else {
        setSubscription(subscriptionData)
        setPlan({
          id: subscriptionData.plan_id,
          name: subscriptionData.plan_name,
          slug: subscriptionData.plan_slug,
          price_cents: subscriptionData.price_cents,
          billing_period: subscriptionData.billing_period,
          features: subscriptionData.features
        })

        // Buscar limites detalhados
        const { data: limitsData, error: limitsError } = await supabase
          .rpc('get_organization_limits', {
            p_organization_id: currentOrganization.id
          })
          .single()

        if (limitsError) throw limitsError

        setLimits(limitsData)
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  // Carregar assinatura quando organização mudar
  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  /**
   * Verifica se pode criar um novo evento
   * @returns {Promise<boolean>}
   */
  const canCreateEvent = useCallback(async () => {
    if (!currentOrganization?.id) return false

    try {
      const { data, error } = await supabase.rpc('can_create_event', {
        p_organization_id: currentOrganization.id
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erro ao verificar limite de eventos:', err)
      return false
    }
  }, [currentOrganization])

  /**
   * Verifica se pode criar um novo cartão no evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<boolean>}
   */
  const canCreateCard = useCallback(async (eventId) => {
    if (!eventId) return false

    try {
      const { data, error } = await supabase.rpc('can_create_card', {
        p_event_id: eventId
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erro ao verificar limite de cartões:', err)
      return false
    }
  }, [])

  /**
   * Verifica se pode criar um novo PDV no evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<boolean>}
   */
  const canCreatePDV = useCallback(async (eventId) => {
    if (!eventId) return false

    try {
      const { data, error } = await supabase.rpc('can_create_pdv', {
        p_event_id: eventId
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erro ao verificar limite de PDVs:', err)
      return false
    }
  }, [])

  /**
   * Verifica se o plano tem uma feature específica
   * @param {string} feature - Nome da feature
   * @returns {boolean}
   */
  const hasFeature = useCallback((feature) => {
    if (!plan?.features) return false
    return plan.features.includes(feature)
  }, [plan])

  /**
   * Verifica se a assinatura está ativa
   * @returns {boolean}
   */
  const isActive = useCallback(() => {
    if (!subscription) return false
    return ['trial', 'active'].includes(subscription.status)
  }, [subscription])

  /**
   * Verifica se está em período de trial
   * @returns {boolean}
   */
  const isTrial = useCallback(() => {
    if (!subscription) return false
    return subscription.status === 'trial'
  }, [subscription])

  /**
   * Calcula dias restantes do trial
   * @returns {number|null}
   */
  const trialDaysRemaining = useCallback(() => {
    if (!subscription?.trial_ends_at) return null
    
    const now = new Date()
    const trialEnd = new Date(subscription.trial_ends_at)
    const diffTime = trialEnd - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }, [subscription])

  /**
   * Verifica se o trial está expirando (menos de 3 dias)
   * @returns {boolean}
   */
  const isTrialExpiring = useCallback(() => {
    const daysRemaining = trialDaysRemaining()
    return daysRemaining !== null && daysRemaining <= 3
  }, [trialDaysRemaining])

  /**
   * Calcula porcentagem de uso de um limite
   * @param {number} current - Uso atual
   * @param {number} max - Limite máximo
   * @returns {number} Porcentagem (0-100)
   */
  const getUsagePercentage = useCallback((current, max) => {
    if (!max || max === null) return 0 // Ilimitado
    return Math.min(100, Math.round((current / max) * 100))
  }, [])

  /**
   * Verifica se está próximo do limite (>= 80%)
   * @param {number} current - Uso atual
   * @param {number} max - Limite máximo
   * @returns {boolean}
   */
  const isNearLimit = useCallback((current, max) => {
    const percentage = getUsagePercentage(current, max)
    return percentage >= 80
  }, [getUsagePercentage])

  /**
   * Verifica se atingiu o limite (>= 100%)
   * @param {number} current - Uso atual
   * @param {number} max - Limite máximo
   * @returns {boolean}
   */
  const isAtLimit = useCallback((current, max) => {
    if (!max || max === null) return false // Ilimitado
    return current >= max
  }, [])

  /**
   * Formata preço de centavos para reais
   * @param {number} cents - Valor em centavos
   * @returns {string} Valor formatado (ex: "R$ 197,00")
   */
  const formatPrice = useCallback((cents) => {
    const reais = cents / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(reais)
  }, [])

  /**
   * Retorna mensagem de status da assinatura
   * @returns {string}
   */
  const getStatusMessage = useCallback(() => {
    if (!subscription) return 'Sem assinatura'

    switch (subscription.status) {
      case 'trial':
        const days = trialDaysRemaining()
        return `Período de teste - ${days} ${days === 1 ? 'dia' : 'dias'} restante${days === 1 ? '' : 's'}`
      case 'active':
        return 'Assinatura ativa'
      case 'past_due':
        return 'Pagamento pendente'
      case 'canceled':
        return 'Assinatura cancelada'
      case 'expired':
        return 'Assinatura expirada'
      default:
        return 'Status desconhecido'
    }
  }, [subscription, trialDaysRemaining])

  return {
    // Dados
    subscription,
    plan,
    limits,
    loading,
    error,

    // Funções de verificação
    canCreateEvent,
    canCreateCard,
    canCreatePDV,
    hasFeature,

    // Status
    isActive,
    isTrial,
    trialDaysRemaining,
    isTrialExpiring,

    // Utilidades de limite
    getUsagePercentage,
    isNearLimit,
    isAtLimit,

    // Formatação
    formatPrice,
    getStatusMessage,

    // Ações
    reload: loadSubscription
  }
}

// Made with Bob
