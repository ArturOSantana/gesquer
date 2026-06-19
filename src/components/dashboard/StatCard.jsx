import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  trendValue,
  className 
}) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      // Se for valor monetário (maior que 100), formatar como moeda
      if (val > 100 || title.toLowerCase().includes('arrecadado') || title.toLowerCase().includes('saldo')) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      }
      // Caso contrário, formatar como número
      return new Intl.NumberFormat('pt-BR').format(val);
    }
    return val;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↑' : '↓';
  };

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-bold break-words">
            {formatValue(value)}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && trendValue && (
            <div className={cn('text-xs font-medium flex items-center gap-1', getTrendColor())}>
              <span>{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

