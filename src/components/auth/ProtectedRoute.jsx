import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute:', {
    path: location.pathname,
    loading,
    isAuthenticated,
    profile: profile ? { role: profile.role, name: profile.name } : null,
    allowedRoles
  });

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    console.log('⏳ Aguardando autenticação...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redireciona para login se não estiver autenticado
  if (!isAuthenticated) {
    console.log('❌ Não autenticado, redirecionando para /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se o usuário tem permissão para acessar a rota
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    console.log('⚠️ Sem permissão, redirecionando...');
    // Redireciona para a página inicial do perfil do usuário
    const redirectMap = {
      admin: '/dashboard',
      caixa: '/caixa/novo-cliente',
      barraca: '/sale',
    };

    const redirectTo = redirectMap[profile?.role] || '/';
    console.log('🔀 Redirecionando para:', redirectTo);
    
    return <Navigate to={redirectTo} replace />;
  }

  // Usuário autenticado e com permissão
  console.log('✅ Acesso permitido');
  return children;
}

// Made with Bob
