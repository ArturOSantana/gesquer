import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Card de métrica com ícone, valor e indicador de tendência
 * @param {Object} props
 * @param {string} props.title - Título da métrica
 * @param {string|number} props.value - Valor principal
 * @param {React.Component} props.icon - Ícone (componente Lucide)
 * @param {string|number} props.trend - Percentual de crescimento (ex: "+12%", -5, 0)
 * @param {string} props.description - Descrição adicional
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.className - Classes CSS adicionais
 */
export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  loading = false,
  className 
}) {
  // Determinar direção da tendência
  const getTrendInfo = () => {
    if (!trend && trend !== 0) return null
    
    const numericTrend = typeof trend === 'string' 
      ? parseFloat(trend.replace(/[^0-9.-]/g, ''))
      : trend
    
    if (numericTrend > 0) {
      return {
        icon: ArrowUpIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: typeof trend === 'string' ? trend : `+${trend}%`
      }
    } else if (numericTrend < 0) {
      return {
        icon: ArrowDownIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: typeof trend === 'string' ? trend : `${trend}%`
      }
    } else {
      return {
        icon: MinusIcon,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: '0%'
      }
    }
  }

  const trendInfo = getTrendInfo()

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <div className="h-4 w-4 text-muted-foreground animate-pulse">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          {trendInfo && (
            <div className="mt-2 h-4 w-16 bg-gray-100 animate-pulse rounded" />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-4 w-4 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trendInfo && (
          <div className="mt-2 flex items-center gap-1">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendInfo.bgColor,
              trendInfo.color
            )}>
              <trendInfo.icon className="h-3 w-3" />
              {trendInfo.label}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground ml-1">
                {description}
              </span>
            )}
          </div>
        )}
        
        {!trendInfo && description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Made with Bob
