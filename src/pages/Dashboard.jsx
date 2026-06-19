import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { SalesChart } from '../components/dashboard/SalesChart';
import { BarracaRanking } from '../components/dashboard/BarracaRanking';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { QuickActions } from '../components/dashboard/QuickActions';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const {
    statistics,
    salesChart,
    barracaRanking,
    recentTransactions,
    alerts,
    loading,
    error,
    refresh,
  } = useDashboard();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Erro ao carregar visão geral</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando visão geral...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Visão</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão da quermesse
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Arrecadado"
          value={statistics?.totalArrecadado || 0}
          description="Valor total de vendas"
        />
        <StatCard
          title="Saldo em Circulação"
          value={statistics?.saldoCirculacao || 0}
          description="Créditos nos cartões"
        />
        <StatCard
          title="Total de Clientes"
          value={statistics?.totalClientes || 0}
          description="Cartões cadastrados"
        />
        <StatCard
          title="Vendas Hoje"
          value={statistics?.totalVendasHoje || 0}
          description="Faturamento do dia"
        />
        <StatCard
          title="Barracas Ativas"
          value={statistics?.barracasAtivas || 0}
          description="Barracas em operação"
        />
        <StatCard
          title="Estoque Baixo"
          value={statistics?.produtosEstoqueBaixo || 0}
          description="Produtos com estoque baixo"
        />
      </div>

      {/* Ações Rápidas */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Gráficos e Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart
          data={salesChart}
          type="bar"
          title="Vendas por Hora"
          description="Últimas 24 horas"
        />
        <BarracaRanking data={barracaRanking} />
      </div>

      {/* Alertas e Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel data={alerts} />
        <RecentTransactions data={recentTransactions} />
      </div>
    </div>
  );
}

