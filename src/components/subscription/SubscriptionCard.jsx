import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useSubscription } from '../../hooks/useSubscription'
import { LimitProgressBar, TrialExpiringWarning } from './LimitWarning'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp
} from 'lucide-react'

/**
 * Componente que exibe informações da assinatura atual
 */
export function SubscriptionCard() {
  const navigate = useNavigate()
  const {
    subscription,
    plan,
    limits,
    loading,
    isTrial,
    trialDaysRemaining,
    isTrialExpiring,
    formatPrice,
    getStatusMessage
  } = useSubscription()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-secondary rounded w-1/2" />
            <div className="h-4 bg-secondary rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem Assinatura</CardTitle>
          <CardDescription>
            Você não possui uma assinatura ativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/organization/upgrade')}>
            Escolher Plano
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    const variants = {
      trial: 'secondary',
      active: 'default',
      past_due: 'destructive',
      canceled: 'outline',
      expired: 'destructive'
    }

    const icons = {
      trial: <Clock className="h-3 w-3 mr-1" />,
      active: <CheckCircle2 className="h-3 w-3 mr-1" />,
      past_due: <XCircle className="h-3 w-3 mr-1" />,
      canceled: <XCircle className="h-3 w-3 mr-1" />,
      expired: <XCircle className="h-3 w-3 mr-1" />
    }

    return (
      <Badge variant={variants[subscription.status]} className="flex items-center w-fit">
        {icons[subscription.status]}
        {getStatusMessage()}
      </Badge>
    )
  }

  const getBillingPeriodLabel = () => {
    const labels = {
      one_time: 'Pagamento Único',
      monthly: 'Mensal',
      yearly: 'Anual'
    }
    return labels[plan.billing_period] || plan.billing_period
  }

  return (
    <div className="space-y-4">
      {/* Aviso de Trial Expirando */}
      {isTrial() && isTrialExpiring() && (
        <TrialExpiringWarning
          daysRemaining={trialDaysRemaining()}
          onUpgrade={() => navigate('/organization/upgrade')}
        />
      )}

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {plan.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {getBillingPeriodLabel()} • {formatPrice(plan.price_cents)}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações de Período */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Período atual: {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')} até{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Limites de Uso */}
          {limits && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Uso Atual
              </h4>

              <div className="space-y-3">
                <LimitProgressBar
                  current={limits.current_events || 0}
                  max={limits.max_events}
                  type="Eventos Ativos"
                />

                {limits.max_cards_per_event && (
                  <LimitProgressBar
                    current={0} // Será calculado por evento
                    max={limits.max_cards_per_event}
                    type="Cartões por Evento"
                  />
                )}

                {limits.max_pdvs_per_event && (
                  <LimitProgressBar
                    current={0} // Será calculado por evento
                    max={limits.max_pdvs_per_event}
                    type="PDVs por Evento"
                  />
                )}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            {!isTrial() && subscription.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/organization/subscription')}
              >
                Gerenciar Assinatura
              </Button>
            )}
            
            {(isTrial() || plan.slug !== 'yearly') && (
              <Button
                size="sm"
                onClick={() => navigate('/organization/upgrade')}
              >
                Fazer Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
