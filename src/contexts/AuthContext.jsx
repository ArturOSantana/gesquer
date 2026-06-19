import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Verifica sessão ao carregar
  useEffect(() => {
    checkAuth();

    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Verifica se há sessão ativa
  async function checkAuth() {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  }

  // Carrega perfil do usuário
  async function loadUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          barraca_id,
          active,
          barracas:barraca_id (
            id,
            nome
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data.active) {
        throw new Error('Usuário inativo');
      }

      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar perfil do usuário',
        variant: 'destructive',
      });
      await logout();
    }
  }

  // Login
  async function login(email, password) {
    try {
      setLoading(true);

      // Autentica com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Carrega perfil do usuário
      await loadUserProfile(authData.user.id);

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!',
      });

      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado';
      } else if (error.message.includes('Usuário inativo')) {
        errorMessage = 'Usuário inativo. Entre em contato com o administrador.';
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }

  // Logout
  async function logout() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setUser(null);
      setProfile(null);

      toast({
        title: 'Logout',
        description: 'Você saiu do sistema',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Verifica se usuário tem permissão
  function hasPermission(requiredRole) {
    if (!profile) return false;

    // Admin tem acesso a tudo
    if (profile.role === 'admin') return true;

    // Verifica role específica
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(profile.role);
    }

    return profile.role === requiredRole;
  }

  // Verifica se usuário pode acessar uma barraca específica
  function canAccessBarraca(barracaId) {
    if (!profile) return false;

    // Admin pode acessar todas
    if (profile.role === 'admin') return true;

    // Barraca só pode acessar a sua própria
    if (profile.role === 'barraca') {
      return profile.barraca_id === barracaId;
    }

    // Caixa não acessa barracas
    return false;
  }

  // Obtém rota inicial baseada no perfil
  function getInitialRoute() {
    if (!profile) return '/login';

    switch (profile.role) {
      case 'admin':
        return '/dashboard';
      case 'caixa':
        return '/caixa/novo-cliente';
      case 'barraca':
        return '/sale';
      default:
        return '/';
    }
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
    canAccessBarraca,
    getInitialRoute,
    isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin',
    isCaixa: profile?.role === 'caixa',
    isBarraca: profile?.role === 'barraca',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Made with Bob
