import { useState, useEffect } from 'react'
import { useSuperAdminDashboard } from '../../hooks/useSuperAdminDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Building2,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Página de Logs de Auditoria
 * Permite visualizar e filtrar todas as ações do sistema
 */
export default function AuditLogs() {
  const { getAuditLogs } = useSuperAdminDashboard()
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_id: '',
    organization_id: '',
    date_from: '',
    date_to: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Carregar logs
  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs(filters, 100)
      setLogs(data)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  const applyFilters = () => {
    loadLogs()
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      action: '',
      resource_type: '',
      user_id: '',
      organization_id: '',
      date_from: '',
      date_to: '',
      search: ''
    })
  }

  // Exportar logs
  const exportLogs = () => {
    const csv = [
      ['Data', 'Usuário', 'Ação', 'Recurso', 'Organização', 'Detalhes'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.user?.name || 'Sistema',
        log.action,
        log.resource_type,
        log.organization?.name || '-',
        JSON.stringify(log.new_values || {})
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString()}.csv`
    a.click()
  }

  // Badge de ação
  const getActionBadge = (action) => {
    const variants = {
      create: { variant: 'default', label: 'Criou', className: 'bg-green-500' },
      update: { variant: 'default', label: 'Atualizou', className: 'bg-blue-500' },
      delete: { variant: 'destructive', label: 'Deletou' },
      login: { variant: 'secondary', label: 'Login' },
      impersonate: { variant: 'default', label: 'Impersonou', className: 'bg-orange-500' },
      export: { variant: 'outline', label: 'Exportou' }
    }
    
    const config = variants[action] || { variant: 'outline', label: action }
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Filtrar logs localmente por busca
  const filteredLogs = logs.filter(log => {
    if (!filters.search) return true
    
    const searchLower = filters.search.toLowerCase()
    return (
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.organization?.name?.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Histórico completo de ações no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportLogs} 
            variant="outline"
            disabled={logs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Busca */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, organização, ação..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>

            {/* Filtros Avançados */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => setFilters({ ...filters, action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="create">Criar</SelectItem>
                      <SelectItem value="update">Atualizar</SelectItem>
                      <SelectItem value="delete">Deletar</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="impersonate">Impersonar</SelectItem>
                      <SelectItem value="export">Exportar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Recurso</Label>
                  <Select
                    value={filters.resource_type}
                    onValueChange={(value) => setFilters({ ...filters, resource_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os recursos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="organization">Organização</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="transaction">Transação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  />
                </div>

                <div className="flex items-end gap-2 md:col-span-2">
                  <Button onClick={applyFilters} className="flex-1">
                    Aplicar Filtros
                  </Button>
                  <Button onClick={clearFilters} variant="outline">
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                Nenhum log encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Linha 1: Usuário e Ação */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {log.user?.name || 'Sistema'}
                          </span>
                          {log.user?.role && (
                            <Badge variant="outline" className="text-xs">
                              {log.user.role === 'superadmin' ? 'SuperAdmin' :
                               log.user.role === 'admin' ? 'Admin' :
                               log.user.role === 'caixa' ? 'Caixa' : 'Usuário'}
                            </Badge>
                          )}
                        </div>
                        {getActionBadge(log.action)}
                        <span className="text-sm text-gray-600">
                          {log.resource_type}
                        </span>
                      </div>

                      {/* Linha 2: Organização */}
                      {log.organization && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="h-3 w-3" />
                          <span>{log.organization.name}</span>
                        </div>
                      )}

                      {/* Linha 3: Detalhes */}
                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Data */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
