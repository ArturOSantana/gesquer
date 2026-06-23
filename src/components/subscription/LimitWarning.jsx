import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'

/**
 * Componente que exibe avisos quando próximo ou no limite de uso
 * @param {Object} props
 * @param {number} props.current - Uso atual
 * @param {number} props.max - Limite máximo (null = ilimitado)
 * @param {string} props.type - Tipo de recurso (eventos, cartões, PDVs)
 * @param {boolean} props.showUpgrade - Se deve mostrar botão de upgrade
 */
export function LimitWarning({ current, max, type, showUpgrade = true }) {
  const navigate = useNavigate()

  // Se ilimitado, não mostra aviso
  if (!max || max === null) return null

  const percentage = Math.round((current / max) * 100)

  // Só mostra aviso se >= 80%
  if (percentage < 80) return null

  const isAtLimit = percentage >= 100
  const isNearLimit = percentage >= 80 && percentage < 100

  const getTypeLabel = () => {
    const labels = {
      eventos: 'eventos',
      cartões: 'cartões',
      cards: 'cartões',
      pdvs: 'PDVs',
      transações: 'transações',
      usuários: 'usuários'
    }
    return labels[type.toLowerCase()] || type
  }

  const getMessage = () => {
    if (isAtLimit) {
      return `Você atingiu o limite de ${max} ${getTypeLabel()}. Faça upgrade do seu plano para continuar.`
    }
    return `Você está usando ${current} de ${max} ${getTypeLabel()} (${percentage}%). Considere fazer upgrade do plano.`
  }

  const getIcon = () => {
    if (isAtLimit) return <AlertCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <Alert variant={isAtLimit ? 'destructive' : 'warning'} className="mb-4">
      {getIcon()}
      <AlertTitle>
        {isAtLimit ? 'Limite Atingido' : 'Próximo do Limite'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        {showUpgrade && (
          <Button
            size="sm"
            variant={isAtLimit ? 'default' : 'outline'}
            onClick={() => navigate('/organization/upgrade')}
            className="ml-4"
          >
            Fazer Upgrade
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Componente que exibe barra de progresso do uso
 */
export function LimitProgressBar({ current, max, type }) {
  if (!max || max === null) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{type}</span>
          <span className="font-medium">Ilimitado</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-full" />
        </div>
      </div>
    )
  }

  const percentage = Math.min(100, Math.round((current / max) * 100))
  
  const getColor = () => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{type}</span>
        <span className="font-medium">
          {current} / {max} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Componente que exibe aviso de trial expirando
 */
export function TrialExpiringWarning({ daysRemaining, onUpgrade }) {
  if (daysRemaining === null || daysRemaining > 3) return null

  const isExpired = daysRemaining === 0

  return (
    <Alert variant={isExpired ? 'destructive' : 'warning'} className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>
        {isExpired ? 'Período de Teste Expirado' : 'Período de Teste Expirando'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isExpired 
            ? 'Seu período de teste expirou. Escolha um plano para continuar usando o sistema.'
            : `Seu período de teste expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Escolha um plano para continuar.`
          }
        </span>
        <Button
          size="sm"
          variant="default"
          onClick={onUpgrade}
          className="ml-4"
        >
          Escolher Plano
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Componente que bloqueia ação quando limite é atingido
 */
export function LimitBlocker({ current, max, type, children, onUpgrade }) {
  const isAtLimit = max && current >= max

  if (!isAtLimit) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">Limite Atingido</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Você atingiu o limite de {max} {type}.
            </p>
          </div>
          <Button onClick={onUpgrade}>
            Fazer Upgrade do Plano
          </Button>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
