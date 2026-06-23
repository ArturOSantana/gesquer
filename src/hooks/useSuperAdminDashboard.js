import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './use-toast'

/**
 * Hook para gerenciar dados do dashboard SuperAdmin
 * Fornece métricas agregadas, organizações, atividades recentes e funções de análise
 */
export function useSuperAdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [growthMetrics, setGrowthMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  /**
   * Carrega todas as métricas globais do sistema
   */
  const loadGlobalMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_metrics')
        .select('*')
        .single()

      if (error) {
        // Tabela não existe ainda - retornar dados mock para MVP
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela global_metrics não existe - usando dados mock')
          return {
            total_organizations: 0,
            total_active_events: 0,
            total_users: 0,
            mrr_cents: 0,
            active_subscriptions: 0,
            trial_subscriptions: 0,
            total_recharges_cents: 0,
            total_transactions: 0,
            canceled_subscriptions: 0,
            new_organizations_month: 0,
            monthly_recharges_cents: 0,
            total_cards: 0
          }
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Erro ao carregar métricas globais:', error)
      return null
    }
  }, [])

  /**
   * Carrega estatísticas de todas as organizações
   */
  const loadOrganizationStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organization_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Tabela não existe ainda - retornar array vazio
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela organization_stats não existe - usando dados mock')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
      return []
    }
  }, [])

  /**
   * Carrega atividades recentes do sistema
   */
  const loadRecentActivity = useCallback(async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('recent_activity')
        .select('*')
        .limit(limit)

      if (error) {
        // Tabela não existe ainda - retornar array vazio
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela recent_activity não existe - usando dados mock')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
      return []
    }
  }, [])

  /**
   * Carrega métricas de crescimento
   */
  const loadGrowthMetrics = useCallback(async (days = 30) => {
    try {
      const { data, error } = await supabase
        .rpc('get_growth_metrics', { p_days: days })

      if (error) {
        // Função não existe ainda - retornar null
        if (error.code === 'PGRST202') {
          console.log('ℹ️ Função get_growth_metrics não existe - usando dados mock')
          return null
        }
        throw error
      }
      
      // Transformar array em objeto para facilitar acesso
      const metricsObj = {}
      data?.forEach(metric => {
        metricsObj[metric.metric] = {
          current: metric.current_value,
          previous: metric.previous_value,
          growth: metric.growth_percentage
        }
      })
      
      return metricsObj
    } catch (error) {
      console.error('Erro ao carregar métricas de crescimento:', error)
      return null
    }
  }, [])

  /**
   * Carrega todos os dados do dashboard
   */
  const loadDashboardData = useCallback(async () => {
    const isRefresh = refreshing
    if (!isRefresh) setLoading(true)
    
    try {
      const [metricsData, orgsData, activityData, growthData] = await Promise.all([
        loadGlobalMetrics(),
        loadOrganizationStats(),
        loadRecentActivity(),
        loadGrowthMetrics()
      ])

      setMetrics(metricsData)
      setOrganizations(orgsData)
      setRecentActivity(activityData)
      setGrowthMetrics(growthData)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [refreshing, loadGlobalMetrics, loadOrganizationStats, loadRecentActivity, loadGrowthMetrics])

  /**
   * Refresh manual dos dados
   */
  const refresh = useCallback(async () => {
    setRefreshing(true)
    await loadDashboardData()
    toast({
      title: 'Dashboard atualizado',
      description: 'Dados atualizados com sucesso'
    })
  }, [loadDashboardData, toast])

  /**
   * Obtém receita por período específico
   */
  const getRevenueByPeriod = useCallback(async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (error) {
        // Tabela não existe ainda
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela transactions não existe')
          return {
            recharges: 0,
            sales: 0,
            total: 0,
            count: 0
          }
        }
        throw error
      }

      // Agregar por tipo
      const summary = {
        recharges: 0,
        sales: 0,
        total: 0,
        count: data?.length || 0
      }

      data?.forEach(transaction => {
        if (transaction.type === 'recarga') {
          summary.recharges += transaction.amount
        } else if (transaction.type === 'venda') {
          summary.sales += transaction.amount
        }
        summary.total += transaction.amount
      })

      return summary
    } catch (error) {
      console.error('Erro ao buscar receita por período:', error)
      return null
    }
  }, [])

  /**
   * Obtém receita mensal agregada
   */
  const getMonthlyRevenue = useCallback(async (months = 12) => {
    try {
      const { data, error } = await supabase
        .from('revenue_by_month')
        .select('*')
        .limit(months)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar receita mensal:', error)
      return []
    }
  }, [])

  /**
   * Busca organizações com filtros
   */
  const searchOrganizations = useCallback(async (filters = {}) => {
    try {
      let query = supabase
        .from('organization_stats')
        .select('*')

      // Aplicar filtros
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.subscription_status) {
        query = query.eq('subscription_status', filters.subscription_status)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      // Ordenação
      const orderBy = filters.orderBy || 'created_at'
      const ascending = filters.ascending !== undefined ? filters.ascending : false
      query = query.order(orderBy, { ascending })

      const { data, error } = await query

      if (error) {
        // Tabela não existe ainda
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela organization_stats não existe')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
      return []
    }
  }, [])

  /**
   * Obtém logs de auditoria com filtros
   */
  const getAuditLogs = useCallback(async (filters = {}, limit = 100) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(name, email, role),
          organization:organizations(name)
        `)

      // Aplicar filtros
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error } = await query

      if (error) {
        // Tabela não existe ainda
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela audit_logs não existe')
          return []
        }
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }, [])

  /**
   * Registra um log de auditoria manualmente
   */
  const logAudit = useCallback(async (action, resourceType, resourceId, oldValues = null, newValues = null) => {
    try {
      const { error } = await supabase.rpc('log_audit', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues
      })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error)
    }
  }, [])

  /**
   * Obtém detalhes de uma organização específica
   */
  const getOrganizationDetails = useCallback(async (organizationId) => {
    try {
      const { data, error } = await supabase
        .from('organization_stats')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) {
        // Tabela não existe ainda
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Tabela organization_stats não existe')
          return null
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Erro ao buscar detalhes da organização:', error)
      return null
    }
  }, [])

  /**
   * Calcula taxa de churn (cancelamentos)
   */
  const calculateChurnRate = useCallback(() => {
    if (!metrics) return 0
    
    const total = metrics.active_subscriptions + metrics.canceled_subscriptions
    if (total === 0) return 0
    
    return ((metrics.canceled_subscriptions / total) * 100).toFixed(2)
  }, [metrics])

  /**
   * Formata valores em centavos para reais
   */
  const formatCurrency = useCallback((cents) => {
    if (!cents) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData()
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [loadDashboardData])

  return {
    // Estados
    metrics,
    organizations,
    recentActivity,
    growthMetrics,
    loading,
    refreshing,
    
    // Funções de carregamento
    refresh,
    loadDashboardData,
    
    // Funções de análise
    getRevenueByPeriod,
    getMonthlyRevenue,
    searchOrganizations,
    getAuditLogs,
    getOrganizationDetails,
    
    // Funções de auditoria
    logAudit,
    
    // Funções auxiliares
    calculateChurnRate,
    formatCurrency
  }
}

// Made with Bob
