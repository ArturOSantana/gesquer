import { Link, useNavigate } from 'react-router-dom';
import { QrCode, ShoppingCart, Package, ArrowLeftRight, History, Store, CreditCard, BarChart3, TrendingUp, Users, Wallet, UserPlus } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '../components/ui/card';
import { useEffect } from 'react';

export default function Home() {
  const { statistics, loading } = useDashboard();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuários para suas páginas específicas
  useEffect(() => {
    if (profile) {
      // SuperAdmin vai para dashboard específico
      if (profile.role === 'superadmin') {
        navigate('/superadmin', { replace: true });
        return;
      }
      
      // Operador de PDV vai direto para vendas
      if (profile.role === 'pdv') {
        navigate('/sale', { replace: true });
        return;
      }
    }
  }, [profile, navigate]);

  // Funcionalidades baseadas no perfil
  const getFeatures = () => {
    if (!profile) return [];

    // SuperAdmin e Admin - Acesso completo
    if (profile.role === 'superadmin' || profile.role === 'admin') {
      return [
        {
          title: 'Visão Geral',
          description: 'Dashboard e estatísticas',
          icon: BarChart3,
          link: '/visao',
        },
        {
          title: 'Novo Cliente',
          description: 'Cadastrar novo cliente',
          icon: UserPlus,
          link: '/caixa/novo-cliente',
        },
        {
          title: 'Recarregar',
          description: 'Adicionar saldo em cartões',
          icon: CreditCard,
          link: '/caixa/recarga',
        },
        {
          title: 'Transferir',
          description: 'Transferir entre cartões',
          icon: ArrowLeftRight,
          link: '/caixa/transferir-cartao',
        },
        {
          title: 'Pontos de Venda',
          description: 'Gerenciar PDVs',
          icon: Store,
          link: '/barracas',
        },
        {
          title: 'Estoque',
          description: 'Controlar produtos',
          icon: Package,
          link: '/estoque',
        },
        {
          title: 'Cartões',
          description: 'Gerenciar cartões',
          icon: CreditCard,
          link: '/cards',
        },
        {
          title: 'Histórico',
          description: 'Ver transações',
          icon: History,
          link: '/historico',
        },
      ];
    }

    // Caixa - Focado em atendimento
    if (profile.role === 'caixa') {
      return [
        {
          title: 'Visão Geral',
          description: 'Dashboard e estatísticas',
          icon: BarChart3,
          link: '/visao',
        },
        {
          title: 'Novo Cliente',
          description: 'Cadastrar novo cliente',
          icon: UserPlus,
          link: '/caixa/novo-cliente',
        },
        {
          title: 'Recarregar',
          description: 'Adicionar saldo em cartões',
          icon: CreditCard,
          link: '/caixa/recarga',
        },
        {
          title: 'Transferir',
          description: 'Transferir entre cartões',
          icon: ArrowLeftRight,
          link: '/caixa/transferir-cartao',
        },
        {
          title: 'Histórico',
          description: 'Ver transações',
          icon: History,
          link: '/historico',
        },
      ];
    }

    // PDV - Apenas vendas (não deveria chegar aqui por causa do redirect)
    if (profile.role === 'pdv') {
      return [
        {
          title: 'Realizar Venda',
          description: 'Processar vendas',
          icon: ShoppingCart,
          link: '/sale',
        },
        {
          title: 'Histórico',
          description: 'Ver transações',
          icon: History,
          link: '/historico',
        },
      ];
    }

    return [];
  };

  const features = getFeatures();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 text-foreground">
          Venditor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Bem-vindo, {profile?.name}!
        </p>
      </div>

      {/* Quick Stats - Apenas para SuperAdmin, Admin e Caixa */}
      {!loading && statistics && ['superadmin', 'admin', 'caixa'].includes(profile?.role) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(statistics.totalArrecadado)}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo em Circulação</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(statistics.saldoCirculacao)}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Clientes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics.totalClientes}
                  </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Grid */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Funcionalidades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="group rounded-lg border bg-card hover:border-primary transition-all hover:shadow-md min-h-[140px] sm:min-h-[160px]"
              >
                <div className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3 sm:space-y-4 h-full">
                  <div className="bg-primary/10 p-3 sm:p-4 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

