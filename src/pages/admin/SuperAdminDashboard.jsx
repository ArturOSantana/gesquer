import { useSuperAdminDashboard } from '../../hooks/useSuperAdminDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import MetricCard from '../../components/admin/MetricCard'
import OrganizationsTable from '../../components/admin/OrganizationsTable'
import ActivityFeed from '../../components/admin/ActivityFeed'
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CreditCard
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'

/**
 * Dashboard principal do SuperAdmin
 * Exibe métricas agregadas, organizações, atividades recentes e alertas
 */
export default function SuperAdminDashboard() {
  const { 
    metrics, 
    organizations, 
    recentActivity,
    growthMetrics,
    loading, 
    refreshing,
    refresh,
    formatCurrency,
    calculateChurnRate
  } = useSuperAdminDashboard()
  
  const navigate = useNavigate()

  // Organizações com trials expirando em breve
  const trialsExpiring = organizations.filter(org => 
    org.subscription_status === 'trial' && 
    org.subscription_end && 
    new Date(org.subscription_end) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  // Organizações com pagamento vencido
  const paymentsOverdue = organizations.filter(org => 
    org.payment_status === 'expired'
  )

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard SuperAdmin</h1>
        </div>
        <Button
          onClick={refresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alertas */}
      {(trialsExpiring.length > 0 || paymentsOverdue.length > 0) && (
        <div className="space-y-3">
          {trialsExpiring.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Trials Expirando</AlertTitle>
              <AlertDescription>
                {trialsExpiring.length} organização(ões) com trial expirando nos próximos 7 dias.
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto"
                  onClick={() => navigate('/superadmin/subscriptions')}
                >
                  Ver detalhes
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {paymentsOverdue.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pagamentos Vencidos</AlertTitle>
              <AlertDescription>
                {paymentsOverdue.length} organização(ões) com pagamento vencido.
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto text-white"
                  onClick={() => navigate('/superadmin/subscriptions')}
                >
                  Ver detalhes
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Organizações"
          value={metrics?.total_organizations || 0}
          icon={Building2}
          trend={growthMetrics?.organizations?.growth}
          description="vs. período anterior"
          loading={loading}
        />
        <MetricCard
          title="Eventos Ativos"
          value={metrics?.total_active_events || 0}
          icon={Calendar}
          trend={growthMetrics?.events?.growth}
          description="vs. período anterior"
          loading={loading}
        />
        <MetricCard
          title="Usuários"
          value={metrics?.total_users || 0}
          icon={Users}
          trend={growthMetrics?.users?.growth}
          description="vs. período anterior"
          loading={loading}
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics?.mrr_cents)}
          icon={DollarSign}
          trend={growthMetrics?.revenue?.growth}
          description="Receita mensal recorrente"
          loading={loading}
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assinaturas Ativas"
          value={metrics?.active_subscriptions || 0}
          icon={CreditCard}
          description={`${metrics?.trial_subscriptions || 0} em trial`}
          loading={loading}
        />
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics?.total_recharges_cents)}
          icon={DollarSign}
          description="Todas as recargas"
          loading={loading}
        />
        <MetricCard
          title="Transações"
          value={metrics?.total_transactions || 0}
          icon={TrendingUp}
          description="Total processadas"
          loading={loading}
        />
        <MetricCard
          title="Taxa de Churn"
          value={`${calculateChurnRate()}%`}
          icon={AlertCircle}
          trend={-parseFloat(calculateChurnRate())}
          description="Cancelamentos"
          loading={loading}
        />
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizações Recentes - 2 colunas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Organizações Recentes</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/organizations')}
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            <OrganizationsTable
              organizations={organizations.slice(0, 5)}
              loading={loading}
              onView={(org) => navigate(`/admin/organizations/${org.id}`)}
              onEdit={(org) => navigate(`/admin/organizations/${org.id}/edit`)}
            />
          </CardContent>
        </Card>

        {/* Atividade Recente - 1 coluna */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividade Recente</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/superadmin/audit-logs')}
            >
              Ver logs
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed 
              activities={recentActivity.slice(0, 10)} 
              loading={loading}
              maxHeight={500}
            />
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Novas Organizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.new_organizations_month || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics?.monthly_recharges_cents)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Recargas dos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cartões Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.total_cards || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20"
              onClick={() => navigate('/admin/organizations/new')}
            >
              <div className="flex flex-col items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">Nova Organização</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-20"
              onClick={() => navigate('/superadmin/plans')}
            >
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Gerenciar Planos</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-20"
              onClick={() => navigate('/superadmin/support')}
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Ferramentas Suporte</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-20"
              onClick={() => navigate('/superadmin/revenue')}
            >
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Relatórios</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
