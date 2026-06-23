import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './use-toast'

export function useEventAdmins(eventId) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Carregar administradores do evento
  const loadAdmins = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_admins')
        .select(`
          id,
          role,
          created_at,
          user:users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Erro ao carregar administradores:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os administradores',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Adicionar administrador ao evento
  const addAdmin = async (userId, role = 'admin') => {
    try {
      const { error } = await supabase
        .from('event_admins')
        .insert({
          event_id: eventId,
          user_id: userId,
          role
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Administrador adicionado ao evento'
      })

      await loadAdmins()
      return true
    } catch (error) {
      console.error('Erro ao adicionar administrador:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o administrador',
        variant: 'destructive'
      })
      return false
    }
  }

  // Remover administrador do evento
  const removeAdmin = async (adminId) => {
    try {
      const { error } = await supabase
        .from('event_admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Administrador removido do evento'
      })

      await loadAdmins()
      return true
    } catch (error) {
      console.error('Erro ao remover administrador:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o administrador',
        variant: 'destructive'
      })
      return false
    }
  }

  // Atualizar role do administrador
  const updateAdminRole = async (adminId, newRole) => {
    try {
      const { error } = await supabase
        .from('event_admins')
        .update({ role: newRole })
        .eq('id', adminId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Função do administrador atualizada'
      })

      await loadAdmins()
      return true
    } catch (error) {
      console.error('Erro ao atualizar função:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a função',
        variant: 'destructive'
      })
      return false
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [eventId])

  return {
    admins,
    loading,
    addAdmin,
    removeAdmin,
    updateAdminRole,
    reload: loadAdmins
  }
}

// Made with Bob
