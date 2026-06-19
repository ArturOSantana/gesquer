import { Link } from 'react-router-dom';
import { QrCode, ShoppingCart, Package, ArrowLeftRight, History, Store, CreditCard, BarChart3, TrendingUp, Users, Wallet } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Card, CardContent } from '../components/ui/card';

export default function Home() {
  const { statistics, loading } = useDashboard();

  const features = [
    {
      title: 'Escanear Cartão',
      description: 'Leia QR codes dos cartões',
      icon: QrCode,
      link: '/scan-card',
    },
    {
      title: 'Realizar Venda',
      description: 'Processar vendas e pagamentos',
      icon: ShoppingCart,
      link: '/sale',
    },
    {
      title: 'Gestão de Estoque',
      description: 'Controlar produtos e estoque',
      icon: Package,
      link: '/stock',
    },
    {
      title: 'Transferências',
      description: 'Transferir saldo entre cartões',
      icon: ArrowLeftRight,
      link: '/transfer',
    },
    {
      title: 'Histórico',
      description: 'Ver transações realizadas',
      icon: History,
      link: '/history',
    },
    {
      title: 'Barracas',
      description: 'Gerenciar barracas',
      icon: Store,
      link: '/barracas',
    },
    {
      title: 'Cartões',
      description: 'Gerenciar cartões',
      icon: CreditCard,
      link: '/cards',
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios',
      icon: BarChart3,
      link: '/reports',
    },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          QuermesseOn!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestão completa de cartões, vendas e estoque
        </p>
      </div>

      {/* Quick Stats */}
      {!loading && statistics && (
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
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Funcionalidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="group rounded-lg border bg-card hover:border-primary transition-all hover:shadow-md"
              >
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
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

// Made with Bob
