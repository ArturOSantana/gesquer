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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-destructive mb-2">Erro ao carregar visão geral</h2>
          <p className="text-sm sm:text-base text-destructive/80 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" className="min-h-[44px]">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">Carregando visão geral...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Visão Geral</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão geral do sistema de gestão da quermesse
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="min-h-[44px] w-full sm:w-auto">
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
      <div className="mb-6 sm:mb-8">
        <QuickActions />
      </div>

      {/* Gráficos e Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <SalesChart
          data={salesChart}
          type="bar"
          title="Vendas por Hora"
          description="Últimas 24 horas"
        />
        <BarracaRanking data={barracaRanking} />
      </div>

      {/* Alertas e Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AlertsPanel data={alerts} />
        <RecentTransactions data={recentTransactions} />
      </div>
    </div>
  );
}

