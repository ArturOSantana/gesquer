import { useState } from 'react'
import { useSuperAdminDashboard } from '../../hooks/useSuperAdminDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { useToast } from '../../hooks/use-toast'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  FileText,
  LogOut
} from 'lucide-react'

/**
 * Ferramentas de Suporte para SuperAdmin
 * Permite impersonation, diagnósticos e visualização de logs do sistema
 */
export default function SupportTools() {
  const { organizations, searchOrganizations, logAudit } = useSuperAdminDashboard()
  const { toast } = useToast()
  
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const [diagnostics, setDiagnostics] = useState(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)

  // Buscar organizações
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchOrganizations({ 
        name: searchTerm,
        orderBy: 'name',
        ascending: true
      })
      setSearchResults(results)
    } catch (error) {
      console.error('Erro ao buscar:', error)
      toast({
        title: 'Erro na busca',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSearching(false)
    }
  }

  // Impersonar organização
  const impersonateOrganization = async (org) => {
    if (!org) return

    setImpersonating(true)
    try {
      // Registrar ação de impersonation no audit log
      await logAudit('impersonate', 'organization', org.id, null, {
        organization_name: org.name,
        timestamp: new Date().toISOString()
      })

      // Salvar contexto atual no sessionStorage
      sessionStorage.setItem('superadmin_impersonation', JSON.stringify({
        original_user: (await supabase.auth.getUser()).data.user,
        target_organization: org,
        started_at: new Date().toISOString()
      }))

      toast({
        title: 'Impersonation ativado',
        description: `Você está agora visualizando como: ${org.name}`,
      })

      // Redirecionar para o dashboard da organização
      // Nota: Isso requer implementação adicional no contexto de autenticação
      window.location.href = `/dashboard?impersonate=${org.id}`
    } catch (error) {
      console.error('Erro ao impersonar:', error)
      toast({
        title: 'Erro ao impersonar',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setImpersonating(false)
    }
  }

  // Sair do modo impersonation
  const exitImpersonation = () => {
    sessionStorage.removeItem('superadmin_impersonation')
    toast({
      title: 'Impersonation encerrado',
      description: 'Você voltou ao modo SuperAdmin',
    })
    window.location.href = '/superadmin'
  }

  // Executar diagnósticos
  const runDiagnostics = async (org) => {
    if (!org) return

    setRunningDiagnostics(true)
    try {
      // Buscar informações detalhadas da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', org.id)
        .single()

      if (orgError) throw orgError

      // Buscar eventos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', org.id)

      if (eventsError) throw eventsError

      // Buscar usuários
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', org.id)

      if (usersError) throw usersError

      // Buscar assinatura
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('organization_id', org.id)
        .single()

      // Buscar cartões e transações
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*, event:events!inner(organization_id)')
        .eq('event.organization_id', org.id)

      const diagnosticsResult = {
        organization: orgData,
        events: events || [],
        users: users || [],
        subscription: subscription || null,
        cards: cards || [],
        health: {
          organization_active: orgData.is_active,
          has_subscription: !!subscription,
          subscription_active: subscription?.status === 'active',
          has_events: events && events.length > 0,
          has_users: users && users.length > 0,
          has_cards: cards && cards.length > 0
        },
        issues: []
      }

      // Identificar problemas
      if (!orgData.is_active) {
        diagnosticsResult.issues.push('Organização inativa')
      }
      if (!subscription) {
        diagnosticsResult.issues.push('Sem assinatura configurada')
      }
      if (subscription && subscription.status !== 'active') {
        diagnosticsResult.issues.push(`Assinatura ${subscription.status}`)
      }
      if (!events || events.length === 0) {
        diagnosticsResult.issues.push('Nenhum evento criado')
      }
      if (!users || users.length === 0) {
        diagnosticsResult.issues.push('Nenhum usuário cadastrado')
      }

      setDiagnostics(diagnosticsResult)
      setSelectedOrg(org)

      toast({
        title: 'Diagnóstico concluído',
        description: `${diagnosticsResult.issues.length} problema(s) encontrado(s)`,
      })
    } catch (error) {
      console.error('Erro ao executar diagnósticos:', error)
      toast({
        title: 'Erro nos diagnósticos',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setRunningDiagnostics(false)
    }
  }

  // Verificar se está em modo impersonation
  const impersonationData = sessionStorage.getItem('superadmin_impersonation')
  const isImpersonating = !!impersonationData

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ferramentas de Suporte</h1>
        <p className="text-muted-foreground">
          Ferramentas avançadas para suporte e diagnóstico
        </p>
      </div>

      {/* Alerta de Impersonation Ativo */}
      {isImpersonating && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Modo Impersonation Ativo</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Você está visualizando como: {JSON.parse(impersonationData).target_organization.name}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exitImpersonation}
              className="ml-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Impersonation
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Impersonar Organização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Impersonar Organização
          </CardTitle>
          <CardDescription>
            Visualize o sistema como se fosse uma organização específica para debug e suporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search">Buscar Organização</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search"
                  placeholder="Digite o nome da organização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados da Busca */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {searchResults.map((org) => (
                <div
                  key={org.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      {org.plan_name || 'Sem plano'} • {org.total_events} eventos • {org.total_users} usuários
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runDiagnostics(org)}
                      disabled={runningDiagnostics}
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      Diagnosticar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => impersonateOrganization(org)}
                      disabled={impersonating}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Impersonar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnósticos */}
      {diagnostics && selectedOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Diagnóstico: {selectedOrg.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Geral */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {diagnostics.health.organization_active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Organização Ativa</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnostics.health.has_subscription ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Tem Assinatura</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnostics.health.subscription_active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Assinatura Ativa</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnostics.health.has_events ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Tem Eventos</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnostics.health.has_users ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Tem Usuários</span>
              </div>
              
              <div className="flex items-center gap-2">
                {diagnostics.health.has_cards ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Tem Cartões</span>
              </div>
            </div>

            {/* Problemas Encontrados */}
            {diagnostics.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Problemas Encontrados</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {diagnostics.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <div className="text-2xl font-bold">{diagnostics.events.length}</div>
                <div className="text-sm text-gray-500">Eventos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{diagnostics.users.length}</div>
                <div className="text-sm text-gray-500">Usuários</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{diagnostics.cards.length}</div>
                <div className="text-sm text-gray-500">Cartões</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {diagnostics.subscription?.plan?.name || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Plano</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs do Sistema
          </CardTitle>
          <CardDescription>
            Visualize logs técnicos e de erro do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.open('/superadmin/audit-logs', '_blank')}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Logs de Auditoria
          </Button>
        </CardContent>
      </Card>

      {/* Informações do Banco de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informações do Banco de Dados
          </CardTitle>
          <CardDescription>
            Estatísticas e informações sobre o banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de Organizações:</span>
              <span className="font-medium">{organizations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Organizações Ativas:</span>
              <span className="font-medium">
                {organizations.filter(o => o.is_active).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Com Assinatura Ativa:</span>
              <span className="font-medium">
                {organizations.filter(o => o.subscription_status === 'active').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
