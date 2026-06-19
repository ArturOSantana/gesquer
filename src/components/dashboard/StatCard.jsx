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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">
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

// Made with Bob
