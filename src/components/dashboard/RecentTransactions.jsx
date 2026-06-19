import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentTransactions({ data }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'sale':
        return '$';
      case 'recharge':
        return '+';
      case 'transfer':
        return '→';
      case 'refund':
        return '←';
      default:
        return '•';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'sale':
        return 'Venda';
      case 'recharge':
        return 'Recarga';
      case 'transfer':
        return 'Transferência';
      case 'refund':
        return 'Estorno';
      default:
        return 'Transação';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'recharge':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'transfer':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'refund':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas 10 transações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>Últimas 10 transações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTransactionColor(transaction.type)}`}
                    >
                      {getTransactionLabel(transaction.type)}
                    </Badge>
                    {transaction.barracas && (
                      <span className="text-xs text-muted-foreground truncate">
                        {transaction.barracas.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      {transaction.cards?.client?.name || 'Cliente'}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {transaction.cards?.id ? `ID: ${String(transaction.cards.id).substring(0, 8)}...` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(transaction.created_at)}
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className={`font-bold ${
                  transaction.type === 'sale' || transaction.type === 'refund'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}>
                  {transaction.type === 'refund' ? '-' : ''}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

