import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AlertsPanel({ data }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return '!';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      case 'success':
        return 'OK';
      default:
        return '•';
    }
  };

  const getAlertVariant = (type) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return 'Agora';
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Alertas e Notificações</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Avisos importantes do sistema</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Tudo certo! Nenhum alerta no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-base sm:text-lg">Alertas e Notificações</span>
          <Badge variant="outline" className="self-start sm:self-auto">
            {data.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Avisos importantes do sistema</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
          {data.map((alert, index) => (
            <Alert
              key={index}
              variant={getAlertVariant(alert.type)}
              className={`${getAlertColor(alert.type)} p-3 sm:p-4`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl mt-0.5 flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-xs sm:text-sm font-semibold mb-1 break-words">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm break-words">
                    {alert.message}
                  </AlertDescription>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

