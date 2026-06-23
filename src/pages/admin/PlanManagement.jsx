import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { 
  Edit, 
  Trash2, 
  Plus,
  Loader2,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react'

export default function PlanManagement() {
  const { toast } = useToast()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_cents', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast({
        title: 'Erro ao carregar planos',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId)

      if (error) throw error

      toast({
        title: 'Plano atualizado',
        description: `Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      })

      loadPlans()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar plano',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const getBillingPeriodLabel = (period) => {
    const labels = {
      one_time: 'Único',
      monthly: 'Mensal',
      yearly: 'Anual'
    }
    return labels[period] || period
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os planos de assinatura disponíveis
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Preço */}
              <div className="flex items-center gap-2 text-2xl font-bold">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                {formatPrice(plan.price_cents)}
                <span className="text-sm text-muted-foreground font-normal">
                  / {getBillingPeriodLabel(plan.billing_period)}
                </span>
              </div>

              {/* Limites */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Eventos:</span>
                  <span className="font-medium">
                    {plan.max_events || 'Ilimitado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cartões/evento:</span>
                  <span className="font-medium">
                    {plan.max_cards_per_event || 'Ilimitado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">PDVs/evento:</span>
                  <span className="font-medium">
                    {plan.max_pdvs_per_event || 'Ilimitado'}
                  </span>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>0 assinaturas ativas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                >
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={plan.is_active}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum plano cadastrado ainda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Made with Bob
