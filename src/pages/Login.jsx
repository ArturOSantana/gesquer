import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, getInitialRoute } = useAuth();
  const navigate = useNavigate();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getInitialRoute());
    }
  }, [isAuthenticated, navigate, getInitialRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Iniciando login...');
      const result = await login(email, password);

      console.log('Resultado do login:', result);

      if (result.success) {
        console.log('Login bem-sucedido, obtendo rota inicial...');
        const initialRoute = getInitialRoute();
        console.log('Redirecionando para:', initialRoute);
        navigate(initialRoute);
      } else {
        console.error('Login falhou:', result.error);
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            QuermesseOn
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Sistema de Gestão de Quermesse
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <Alert variant="destructive" className="rounded-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="h-10 sm:h-11 text-sm sm:text-base rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base rounded-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-xs text-gray-500">
            © 2024 QuermesseOn. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

