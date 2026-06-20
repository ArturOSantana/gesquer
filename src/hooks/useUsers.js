import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar usuários
 * Fornece funções CRUD para usuários (apenas SuperAdmin)
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  /**
   * Busca todos os usuários
   */
  const fetchUsers = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('users')
        .select(`
          *,
          barraca:barracas(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Aplica filtros
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.barraca_id) {
        query = query.eq('barraca_id', filters.barraca_id);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setUsers(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um usuário por ID
   */
  const getUserById = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          barraca:barracas(
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verifica dependências de um usuário antes de deletar
   * Retorna avisos sobre vendas e atividades
   */
  const checkUserDependencies = useCallback(async (userId) => {
    try {
      const warnings = [];

      // Busca informações do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name, email, role, barraca_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Verifica se é o próprio usuário
      if (currentUser && userId === currentUser.id) {
        warnings.push('Você não pode excluir sua própria conta');
        return {
          canDelete: false,
          warnings,
          error: 'Não é possível excluir próprio usuário'
        };
      }

      // Verifica se é o último SuperAdmin
      if (user.role === 'superadmin') {
        const { data: superAdmins, error: countError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'superadmin');

        if (countError) throw countError;

        if (superAdmins && superAdmins.length <= 1) {
          warnings.push('Este é o último SuperAdmin do sistema');
          return {
            canDelete: false,
            warnings,
            error: 'Não é possível excluir o último SuperAdmin'
          };
        }
      }

      // Verifica vendas realizadas
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', userId);

      if (salesError) throw salesError;

      if (sales && sales.length > 0) {
        warnings.push(`${sales.length} venda(s) registrada(s)`);
      }

      // Verifica transações
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId);

      if (transactionsError) throw transactionsError;

      if (transactions && transactions.length > 0) {
        warnings.push(`${transactions.length} transação(ões) registrada(s)`);
      }

      return {
        canDelete: true,
        warnings,
        dependencies: {
          sales: sales.length,
          transactions: transactions.length
        }
      };
    } catch (err) {
      console.error('Erro ao verificar dependências do usuário:', err);
      return {
        canDelete: false,
        warnings: ['Erro ao verificar dependências'],
        error: err.message
      };
    }
  }, [currentUser]);

  /**
   * Deleta um usuário (apenas SuperAdmin)
   * Verifica dependências antes de deletar
   */
  const deleteUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // Verifica dependências
      const { canDelete, error: checkError } = await checkUserDependencies(userId);

      if (!canDelete) {
        throw new Error(checkError || 'Não é possível excluir este usuário');
      }

      // Deleta o usuário
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Atualiza lista local
      setUsers(prev => prev.filter(user => user.id !== userId));

      return { success: true, error: null };
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [checkUserDependencies]);

  /**
   * Cria um novo usuário
   */
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Validações
      if (!userData.name || userData.name.trim().length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }

      if (!userData.email) {
        throw new Error('Email é obrigatório');
      }

      if (!userData.role) {
        throw new Error('Função é obrigatória');
      }

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{
          name: userData.name.trim(),
          email: userData.email.trim(),
          role: userData.role,
          barraca_id: userData.barraca_id || null
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualiza lista local
      setUsers(prev => [data, ...prev]);

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza um usuário
   */
  const updateUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      setError(null);

      // Validações
      if (userData.name && userData.name.trim().length < 3) {
        throw new Error('Nome deve ter pelo menos 3 caracteres');
      }

      const updateData = {};
      if (userData.name !== undefined) {
        updateData.name = userData.name.trim();
      }
      if (userData.email !== undefined) {
        updateData.email = userData.email.trim();
      }
      if (userData.role !== undefined) {
        updateData.role = userData.role;
      }
      if (userData.barraca_id !== undefined) {
        updateData.barraca_id = userData.barraca_id;
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualiza lista local
      setUsers(prev => 
        prev.map(user => user.id === userId ? data : user)
      );

      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    users,
    loading,
    error,

    // Funções CRUD
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    checkUserDependencies,
  };
}

// Made with Bob