import { useState, useEffect } from 'react'
import { useSuperAdminDashboard } from '../../hooks/useSuperAdminDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Página de Relatórios de Receita
 * Exibe análises financeiras detalhadas com gráficos
 */
export default function RevenueReports() {
  const { 
    metrics, 
    getMonthlyRevenue, 
    getRevenueByPeriod,
    formatCurrency,
    calculateChurnRate,
    organizations
  } = useSuperAdminDashboard()

  const [period, setPeriod] = useState('12') // meses
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [customPeriodData, setCustomPeriodData] = useState(null)

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Carregar dados
  useEffect(() => {
    loadRevenueData()
  }, [period])

  const loadRevenueData = async () => {
    setLoading(true)
    try {
      const data = await getMonthlyRevenue(parseInt(period))
      
      // Formatar dados para os gráficos
      const formattedData = data.map(item => ({
        month: format(new Date(item.month), 'MMM/yy', { locale: ptBR }),
        monthFull: format(new Date(item.month), 'MMMM yyyy', { locale: ptBR }),
        recharges: item.recharges_cents / 100,
        sales: item.sales_cents / 100,
        total: item.total_cents / 100,
        organizations: item.organizations_count,
        transactions: item.transactions_count
      })).reverse()

      setMonthlyData(formattedData)

      // Calcular período customizado (últimos 30 dias)
      const endDate = new Date()
      const startDate = subMonths(endDate, 1)
      const periodData = await getRevenueByPeriod(
        startDate.toISOString(),
        endDate.toISOString()
      )
      setCustomPeriodData(periodData)
    } catch (error) {
      console.error('Erro ao carregar dados de receita:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular MRR (Monthly Recurring Revenue)
  const calculateMRR = () => {
    return metrics?.mrr_cents || 0
  }

  // Calcular crescimento MRR
  const calculateMRRGrowth = () => {
    if (monthlyData.length < 2) return 0
    const current = monthlyData[monthlyData.length - 1]?.total || 0
    const previous = monthlyData[monthlyData.length - 2]?.total || 0
    if (previous === 0) return 0
    return (((current - previous) / previous) * 100).toFixed(2)
  }

  // Dados para gráfico de pizza (distribuição por plano)
  const planDistribution = organizations.reduce((acc, org) => {
    const planName = org.plan_name || 'Sem plano'
    if (!acc[planName]) {
      acc[planName] = { name: planName, value: 0, count: 0 }
    }
    acc[planName].value += org.plan_price || 0
    acc[planName].count += 1
    return acc
  }, {})

  const pieData = Object.values(planDistribution).map(item => ({
    name: `${item.name} (${item.count})`,
    value: item.value / 100
  }))

  // Exportar relatório
  const exportReport = () => {
    const csv = [
      ['Mês', 'Recargas', 'Vendas', 'Total', 'Organizações', 'Transações'].join(','),
      ...monthlyData.map(item => [
        item.monthFull,
        item.recharges.toFixed(2),
        item.sales.toFixed(2),
        item.total.toFixed(2),
        item.organizations,
        item.transactions
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${new Date().toISOString()}.csv`
    a.click()
  }

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value * 100)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Receita</h1>
          <p className="text-muted-foreground">
            Análise financeira detalhada do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={loadRevenueData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateMRR())}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita Mensal Recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crescimento MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{calculateMRRGrowth()}%</div>
              {parseFloat(calculateMRRGrowth()) > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateChurnRate()}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cancelamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.total_recharges_cents)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as recargas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Receita ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Receita ao Longo do Tempo</CardTitle>
          <CardDescription>
            Evolução da receita nos últimos {period} meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="recharges" 
                stroke="#0088FE" 
                name="Recargas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#00C49F" 
                name="Vendas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#FF8042" 
                name="Total"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Área - Receita Acumulada */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Acumulada</CardTitle>
            <CardDescription>
              Crescimento acumulado da receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8884D8" 
                  fill="#8884D8"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Plano</CardTitle>
            <CardDescription>
              Distribuição de receita entre planos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value * 100)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Transações por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Transações por Mês</CardTitle>
            <CardDescription>
              Volume de transações processadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="#8884D8" name="Transações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Organizações Ativas */}
        <Card>
          <CardHeader>
            <CardTitle>Organizações Ativas</CardTitle>
            <CardDescription>
              Número de organizações por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="organizations" fill="#00C49F" name="Organizações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do Período */}
      {customPeriodData && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Recargas</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(customPeriodData.recharges)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Vendas</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(customPeriodData.sales)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(customPeriodData.total)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Transações</div>
                <div className="text-2xl font-bold">
                  {customPeriodData.count}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Made with Bob
