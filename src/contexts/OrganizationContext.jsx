import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const OrganizationContext = createContext()

export function OrganizationProvider({ children }) {
  const { user, profile } = useAuth()
  const [currentOrganization, setCurrentOrganization] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar organização do usuário ao fazer login
  useEffect(() => {
    if (profile) {
      loadUserOrganization()
      
      // Se for superadmin, carregar todas as organizações
      if (profile.role === 'superadmin') {
        loadAllOrganizations()
      }
    } else {
      setCurrentOrganization(null)
      setOrganizations([])
      setLoading(false)
    }
  }, [profile])

  // Carregar organização do usuário
  const loadUserOrganization = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 OrganizationContext - Verificando perfil:', {
        profileId: profile?.id,
        profileRole: profile?.role,
        organizationId: profile?.organization_id
      })
      
      if (!profile?.id) {
        console.log('⚠️ Sem profile.id, saindo...')
        setLoading(false)
        return
      }

      // SuperAdmin não precisa de organização específica - tem acesso a tudo
      if (profile.role === 'superadmin') {
        console.log('✅ SuperAdmin detectado - acesso total sem organização')
        setCurrentOrganization(null)
        setError(null)
        setLoading(false)
        return
      }

      console.log('👤 Usuário não é SuperAdmin, verificando organização...')
      
      // Para outros usuários, carregar organização
      if (!profile.organization_id) {
        console.error('❌ Usuário sem organization_id:', profile)
        throw new Error('Usuário sem organização vinculada')
      }

      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (fetchError) throw fetchError

      setCurrentOrganization(data)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar organização:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Carregar todas as organizações (apenas superadmin)
  const loadAllOrganizations = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (fetchError) {
        // Se a tabela não existir, apenas avisar no console mas não quebrar
        if (fetchError.code === 'PGRST205') {
          console.warn('⚠️ Tabela organizations não existe ainda no banco de dados')
          setOrganizations([])
          return
        }
        throw fetchError
      }

      setOrganizations(data || [])
    } catch (err) {
      console.error('Erro ao carregar organizações:', err)
      // Não definir erro para não quebrar a aplicação
      setOrganizations([])
    }
  }

  // Criar nova organização (apenas superadmin)
  const createOrganization = async (organizationData) => {
    try {
      if (profile?.role !== 'superadmin') {
        throw new Error('Apenas SuperAdmin pode criar organizações')
      }

      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select()
        .single()

      if (insertError) throw insertError

      // Atualizar lista de organizações
      await loadAllOrganizations()

      return { data, error: null }
    } catch (err) {
      console.error('Erro ao criar organização:', err)
      return { data: null, error: err.message }
    }
  }

  // Atualizar organização
  const updateOrganization = async (id, updates) => {
    try {
      // Verificar permissões
      const isSuperAdmin = profile?.role === 'superadmin'
      if (!isSuperAdmin && profile?.organization_id !== id) {
        throw new Error('Sem permissão para atualizar esta organização')
      }

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar estado local
      if (currentOrganization?.id === id) {
        setCurrentOrganization(data)
      }

      // Se for superadmin, atualizar lista
      if (isSuperAdmin) {
        await loadAllOrganizations()
      }

      return { data, error: null }
    } catch (err) {
      console.error('Erro ao atualizar organização:', err)
      return { data: null, error: err.message }
    }
  }

  // Deletar organização (apenas superadmin)
  const deleteOrganization = async (id) => {
    try {
      if (profile?.role !== 'superadmin') {
        throw new Error('Apenas SuperAdmin pode deletar organizações')
      }

      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Atualizar lista
      await loadAllOrganizations()

      return { error: null }
    } catch (err) {
      console.error('Erro ao deletar organização:', err)
      return { error: err.message }
    }
  }

  // Alternar organização ativa (apenas superadmin)
  const toggleOrganizationStatus = async (id, isActive) => {
    return updateOrganization(id, { is_active: isActive })
  }

  // Obter organização por ID
  const getOrganizationById = async (id) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return { data, error: null }
    } catch (err) {
      console.error('Erro ao buscar organização:', err)
      return { data: null, error: err.message }
    }
  }

  // Obter organização por slug
  const getOrganizationBySlug = async (slug) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (fetchError) throw fetchError

      return { data, error: null }
    } catch (err) {
      console.error('Erro ao buscar organização:', err)
      return { data: null, error: err.message }
    }
  }

  // Verificar se usuário é superadmin
  const isSuperAdmin = profile?.role === 'superadmin'

  // Verificar se usuário é organizador
  const isOrganizador = profile?.role === 'organizador'

  // Verificar se usuário pode gerenciar organizações
  const canManageOrganizations = isSuperAdmin

  // Verificar se usuário pode editar sua organização
  const canEditOrganization = isSuperAdmin || isOrganizador

  const value = {
    // Estado
    currentOrganization,
    organizations,
    loading,
    error,

    // Funções
    loadUserOrganization,
    loadAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    toggleOrganizationStatus,
    getOrganizationById,
    getOrganizationBySlug,

    // Permissões
    isSuperAdmin,
    isOrganizador,
    canManageOrganizations,
    canEditOrganization,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization deve ser usado dentro de OrganizationProvider')
  }
  return context
}

// Made with Bob
