import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './use-toast'

export function usePDVOperators(pdvId) {
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Carregar operadores do PDV
  const loadOperators = async () => {
    if (!pdvId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pdv_operators')
        .select(`
          id,
          is_active,
          created_at,
          user:users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('pdv_id', pdvId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setOperators(data || [])
    } catch (error) {
      console.error('Erro ao carregar operadores:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os operadores',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Vincular operador ao PDV
  const assignOperator = async (userId) => {
    try {
      const { error } = await supabase
        .from('pdv_operators')
        .insert({
          pdv_id: pdvId,
          user_id: userId,
          is_active: true
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Operador vinculado ao PDV'
      })

      await loadOperators()
      return true
    } catch (error) {
      console.error('Erro ao vincular operador:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível vincular o operador',
        variant: 'destructive'
      })
      return false
    }
  }

  // Desvincular operador do PDV
  const removeOperator = async (operatorId) => {
    try {
      const { error } = await supabase
        .from('pdv_operators')
        .delete()
        .eq('id', operatorId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Operador desvinculado do PDV'
      })

      await loadOperators()
      return true
    } catch (error) {
      console.error('Erro ao desvincular operador:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível desvincular o operador',
        variant: 'destructive'
      })
      return false
    }
  }

  // Ativar/desativar operador
  const toggleOperatorStatus = async (operatorId, isActive) => {
    try {
      const { error } = await supabase
        .from('pdv_operators')
        .update({ is_active: isActive })
        .eq('id', operatorId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `Operador ${isActive ? 'ativado' : 'desativado'}`
      })

      await loadOperators()
      return true
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      })
      return false
    }
  }

  useEffect(() => {
    loadOperators()
  }, [pdvId])

  return {
    operators,
    loading,
    assignOperator,
    removeOperator,
    toggleOperatorStatus,
    reload: loadOperators
  }
}

// Made with Bob
