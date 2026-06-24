import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { ArrowLeft, Save, Users } from 'lucide-react'

export default function OrganizationLimits() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState(null)
  const [limits, setLimits] = useState({
    max_users_caixa: 5,
    max_users_pdv: 10,
    max_users_admin: 3
  })
  const [stats, setStats] = useState({
    current_caixa: 0,
    current_pdv: 0,
    current_admin: 0
  })

  useEffect(() => {
    if (id) {
      loadOrganization()
    }
  }, [id])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      
      // Carregar organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError) throw orgError

      setOrganization(orgData)
      setLimits({
        max_users_caixa: orgData.max_users_caixa || 5,
        max_users_pdv: orgData.max_users_pdv || 10,
        max_users_admin: orgData.max_users_admin || 3
      })

      // Carregar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('organization_user_stats')
        .select('*')
        .eq('organization_id', id)
        .single()

      if (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError)
      } else if (statsData) {
        setStats({
          current_caixa: statsData.current_caixa || 0,
          current_pdv: statsData.current_pdv || 0,
          current_admin: statsData.current_admin || 0
        })
      }
    } catch (err) {
      console.error('Erro ao carregar organização:', err)
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('organizations')
        .update({
          max_users_caixa: parseInt(limits.max_users_caixa),
          max_users_pdv: parseInt(limits.max_users_pdv),
          max_users_admin: parseInt(limits.max_users_admin)
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Limites atualizados com sucesso'
      })

      navigate(`/admin/organizations/${id}`)
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Organização não encontrada</p>
            <Button onClick={() => navigate('/admin/organizations')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/admin/organizations/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Limites</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
      </div>

      {/* Estatísticas Atuais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Uso Atual
          </CardTitle>
          <CardDescription>
            Quantidade de usuários atualmente cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Caixas</p>
              <p className="text-2xl font-bold">{stats.current_caixa}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Operadores PDV</p>
              <p className="text-2xl font-bold">{stats.current_pdv}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold">{stats.current_admin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Limites */}
      <Card>
        <CardHeader>
          <CardTitle>Definir Limites</CardTitle>
          <CardDescription>
            Configure o número máximo de usuários que esta organização pode criar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Limite de Caixas</Label>
            <Input
              type="number"
              min="0"
              value={limits.max_users_caixa}
              onChange={(e) => setLimits({ ...limits, max_users_caixa: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Atual: {stats.current_caixa} / {limits.max_users_caixa}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Limite de Operadores PDV</Label>
            <Input
              type="number"
              min="0"
              value={limits.max_users_pdv}
              onChange={(e) => setLimits({ ...limits, max_users_pdv: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Atual: {stats.current_pdv} / {limits.max_users_pdv}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Limite de Administradores</Label>
            <Input
              type="number"
              min="0"
              value={limits.max_users_admin}
              onChange={(e) => setLimits({ ...limits, max_users_admin: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Atual: {stats.current_admin} / {limits.max_users_admin}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Limites'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/admin/organizations/${id}`)}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
