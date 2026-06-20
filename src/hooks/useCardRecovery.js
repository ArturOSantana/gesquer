import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { validatePhone, validateCPF, sanitizeCPF } from '../lib/validators'
import { hashCPF } from '../lib/crypto'
import { useToast } from './use-toast'

/**
 * Hook para gerenciar recuperação de cartão
 */
export function useCardRecovery() {
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [cpfAttempts, setCpfAttempts] = useState(0)
  const [validationMethod, setValidationMethod] = useState(null)
  const { toast } = useToast()

  const MAX_CPF_ATTEMPTS = 3

  /**
   * Busca cliente por telefone
   */
  const searchClientByPhone = useCallback(async (phone) => {
    setLoading(true)
    setSearchResults(null)
    setCpfAttempts(0)
    setValidationMethod(null)

    try {
      // Valida telefone
      const phoneValidation = validatePhone(phone)
      if (!phoneValidation.valid) {
        toast({
          title: 'Erro',
          description: phoneValidation.error,
          variant: 'destructive'
        })
        return { success: false, error: phoneValidation.error }
      }

      const cleanPhone = phoneValidation.phone

      // Busca clientes com esse telefone
      const { data, error } = await supabase.rpc('search_client_by_phone', {
        p_phone: cleanPhone
      })

      if (error) throw error

      if (!data || data.length === 0) {
        toast({
          title: 'Cliente não encontrado',
          description: 'Nenhum cliente encontrado com este telefone',
          variant: 'destructive'
        })
        return { success: false, error: 'Cliente não encontrado' }
      }

      // Se houver múltiplos clientes, retorna lista
      setSearchResults(data)

      toast({
        title: 'Cliente(s) encontrado(s)',
        description: `${data.length} cliente(s) encontrado(s) com este telefone`
      })

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar cliente. Tente novamente.',
        variant: 'destructive'
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Valida CPF do cliente
   */
  const validateWithCPF = useCallback(async (clientId, cpf, encryptionKey) => {
    if (cpfAttempts >= MAX_CPF_ATTEMPTS) {
      toast({
        title: 'Tentativas excedidas',
        description: 'Número máximo de tentativas de CPF excedido. Use validação presencial.',
        variant: 'destructive'
      })
      return { success: false, error: 'Tentativas excedidas' }
    }

    setLoading(true)

    try {
      // Valida formato do CPF
      const cpfValidation = validateCPF(cpf)
      if (!cpfValidation.valid) {
        setCpfAttempts(prev => prev + 1)
        toast({
          title: 'CPF inválido',
          description: `${cpfValidation.error}. Tentativa ${cpfAttempts + 1} de ${MAX_CPF_ATTEMPTS}`,
          variant: 'destructive'
        })
        return { success: false, error: cpfValidation.error }
      }

      const cleanCPF = sanitizeCPF(cpf)

      // Busca cliente e valida CPF usando a função do banco
      const { data, error } = await supabase.rpc('validate_client_recovery', {
        p_phone: searchResults[0].phone,
        p_name: searchResults[0].name,
        p_cpf: cleanCPF,
        p_encryption_key: encryptionKey
      })

      if (error) throw error

      if (!data || data.length === 0) {
        setCpfAttempts(prev => prev + 1)
        const remainingAttempts = MAX_CPF_ATTEMPTS - cpfAttempts - 1
        
        toast({
          title: 'CPF não corresponde',
          description: remainingAttempts > 0 
            ? `CPF não corresponde ao cadastrado. ${remainingAttempts} tentativa(s) restante(s)`
            : 'Tentativas excedidas. Use validação presencial.',
          variant: 'destructive'
        })
        
        return { success: false, error: 'CPF não corresponde' }
      }

      // CPF validado com sucesso
      setValidationMethod('cpf')
      
      // Registra log de validação
      await logRecoveryAttempt(clientId, 'cpf', 'CPF validado com sucesso')

      toast({
        title: 'CPF validado',
        description: 'Identidade confirmada com sucesso'
      })

      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Erro ao validar CPF:', error)
      setCpfAttempts(prev => prev + 1)
      toast({
        title: 'Erro',
        description: 'Erro ao validar CPF. Tente novamente.',
        variant: 'destructive'
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [cpfAttempts, searchResults, toast])

  /**
   * Valida presencialmente (operador confirma documento)
   */
  const validatePresential = useCallback(async (clientId, operatorId, notes = null) => {
    setLoading(true)

    try {
      // Registra validação presencial
      const result = await logRecoveryAttempt(clientId, 'presencial', notes || 'Documento validado presencialmente')

      if (result.success) {
        setValidationMethod('presencial')
        
        toast({
          title: 'Validação presencial confirmada',
          description: 'Identidade confirmada pelo operador'
        })

        return { success: true }
      }

      return result
    } catch (error) {
      console.error('Erro ao validar presencialmente:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao registrar validação presencial',
        variant: 'destructive'
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Registra tentativa de recuperação no log
   */
  const logRecoveryAttempt = useCallback(async (clientId, method, notes = null) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      
      const { data, error } = await supabase.rpc('log_recovery_attempt', {
        p_client_id: clientId,
        p_operator_id: userData?.user?.id,
        p_validation_method: method,
        p_notes: notes
      })

      if (error) throw error

      return { success: true, logId: data }
    } catch (error) {
      console.error('Erro ao registrar log:', error)
      return { success: false, error: error.message }
    }
  }, [])

  /**
   * Transfere saldo para novo cartão
   */
  const transferToNewCard = useCallback(async (oldCardId, newCardQR) => {
    if (!validationMethod) {
      toast({
        title: 'Validação necessária',
        description: 'É necessário validar a identidade antes de transferir',
        variant: 'destructive'
      })
      return { success: false, error: 'Validação necessária' }
    }

    setLoading(true)

    try {
      // Busca cartão antigo
      const { data: oldCard, error: oldCardError } = await supabase
        .from('cards')
        .select('*, client:clients(*)')
        .eq('id', oldCardId)
        .eq('status', 'active')
        .single()

      if (oldCardError) throw oldCardError

      if (!oldCard) {
        toast({
          title: 'Erro',
          description: 'Cartão antigo não encontrado ou já desativado',
          variant: 'destructive'
        })
        return { success: false, error: 'Cartão não encontrado' }
      }

      // Busca ou cria novo cartão
      let newCard
      const { data: existingCard, error: searchError } = await supabase
        .from('cards')
        .select('*')
        .eq('uuid', newCardQR)
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError
      }

      if (existingCard) {
        // Cartão já existe
        if (existingCard.status === 'active' && existingCard.client_id) {
          toast({
            title: 'Erro',
            description: 'Este cartão já está ativo e vinculado a outro cliente',
            variant: 'destructive'
          })
          return { success: false, error: 'Cartão já vinculado' }
        }
        newCard = existingCard
      } else {
        // Cria novo cartão
        const { data: createdCard, error: createError } = await supabase
          .from('cards')
          .insert({
            uuid: newCardQR,
            status: 'inactive',
            balance: 0
          })
          .select()
          .single()

        if (createError) throw createError
        newCard = createdCard
      }

      // Inicia transação de transferência
      const { data: userData } = await supabase.auth.getUser()

      // Desativa cartão antigo
      const { error: deactivateError } = await supabase
        .from('cards')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', oldCardId)

      if (deactivateError) throw deactivateError

      // Ativa novo cartão com o saldo transferido
      const { error: activateError } = await supabase
        .from('cards')
        .update({
          client_id: oldCard.client_id,
          status: 'active',
          balance: oldCard.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', newCard.id)

      if (activateError) throw activateError

      // Registra transação de transferência
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          card_id: newCard.id,
          type: 'transfer',
          amount: oldCard.balance,
          description: `Transferência do cartão ${oldCard.uuid} (recuperação)`,
          operator_id: userData?.user?.id,
          validation_method: validationMethod
        })

      if (transactionError) throw transactionError

      toast({
        title: 'Transferência concluída',
        description: `Saldo de R$ ${oldCard.balance.toFixed(2)} transferido com sucesso`
      })

      // Limpa estado
      setSearchResults(null)
      setCpfAttempts(0)
      setValidationMethod(null)

      return { 
        success: true, 
        oldCard, 
        newCard: { ...newCard, balance: oldCard.balance }
      }
    } catch (error) {
      console.error('Erro ao transferir cartão:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao transferir cartão. Tente novamente.',
        variant: 'destructive'
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [validationMethod, toast])

  /**
   * Reseta o estado do hook
   */
  const reset = useCallback(() => {
    setSearchResults(null)
    setCpfAttempts(0)
    setValidationMethod(null)
    setLoading(false)
  }, [])

  return {
    loading,
    searchResults,
    cpfAttempts,
    maxCpfAttempts: MAX_CPF_ATTEMPTS,
    validationMethod,
    searchClientByPhone,
    validateWithCPF,
    validatePresential,
    transferToNewCard,
    reset
  }
}

// Made with Bob