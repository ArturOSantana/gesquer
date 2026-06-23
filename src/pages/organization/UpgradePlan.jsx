import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useSubscription } from '../../hooks/useSubscription'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { 
  Check, 
  Zap, 
  TrendingUp, 
  Crown,
  Loader2
} from 'lucide-react'

export default function UpgradePlan() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { subscription, plan: currentPlan, formatPrice } = useSubscription()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
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

  const handleSelectPlan = async (planId) => {
    setUpgrading(planId)
    
    try {
      // Aqui você integraria com o gateway de pagamento
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'A integração com o gateway de pagamento será implementada em breve.',
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      toast({
        title: 'Erro ao processar',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setUpgrading(null)
    }
  }

  const getPlanIcon = (slug) => {
    const icons = {
      trial: Zap,
      event: TrendingUp,
      monthly: TrendingUp,
      yearly: Crown
    }
    return icons[slug] || TrendingUp
  }

  const getPlanColor = (slug) => {
    const colors = {
      trial: 'border-gray-300',
      event: 'border-blue-500',
      monthly: 'border-purple-500',
      yearly: 'border-yellow-500'
    }
    return colors[slug] || 'border-gray-300'
  }

  const isCurrentPlan = (planSlug) => {
    return currentPlan?.slug === planSlug
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
        <p className="text-muted-foreground mt-2">
          Selecione o plano ideal para suas necessidades
        </p>
      </div>

      {currentPlan && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Plano Atual: {currentPlan.name}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.slug)
          const isCurrent = isCurrentPlan(plan.slug)
          
          return (
            <Card 
              key={plan.id}
              className={`relative ${getPlanColor(plan.slug)} ${
                isCurrent ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.slug === 'yearly' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-500">Mais Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-8 w-8" />
                  {isCurrent && <Badge>Atual</Badge>}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-3xl font-bold">
                    {formatPrice(plan.price_cents)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.billing_period === 'one_time' && 'Pagamento único'}
                    {plan.billing_period === 'monthly' && 'por mês'}
                    {plan.billing_period === 'yearly' && 'por ano'}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.max_events || 'Eventos ilimitados'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.max_cards_per_event 
                        ? `${plan.max_cards_per_event} cartões`
                        : 'Cartões ilimitados'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.max_pdvs_per_event 
                        ? `${plan.max_pdvs_per_event} PDVs`
                        : 'PDVs ilimitados'
                      }
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {upgrading === plan.id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isCurrent ? 'Plano Atual' : 'Selecionar'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    </div>
  )
}

// Made with Bob
