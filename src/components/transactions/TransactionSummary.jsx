import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de resumo de transações
 * Exibe estatísticas agregadas das transações
 */
export function TransactionSummary({ stats }) {
  if (!stats) return null;

  // Calcula totais por categoria
  const totalRecharges = stats.byType.recharge?.amount || 0;
  const totalPurchases = stats.byType.purchase?.amount || 0;
  const totalRefunds = stats.byType.refund?.amount || 0;
  const totalTransfersIn = stats.byType.transfer_in?.amount || 0;
  const totalTransfersOut = stats.byType.transfer_out?.amount || 0;

  // Calcula saldo líquido (entradas - saídas)
  const netBalance = totalRecharges + totalRefunds + totalTransfersIn - totalPurchases - totalTransfersOut;

  // Cards de estatísticas
  const summaryCards = [
    {
      title: 'Total de Transações',
      value: stats.total,
      icon: TrendingUp,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'number'
    },
    {
      title: 'Recargas',
      value: totalRecharges,
      count: stats.byType.recharge?.count || 0,
      icon: ArrowUpCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency'
    },
    {
      title: 'Compras',
      value: totalPurchases,
      count: stats.byType.purchase?.count || 0,
      icon: ShoppingCart,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'currency'
    },
    {
      title: 'Estornos',
      value: totalRefunds,
      count: stats.byType.refund?.count || 0,
      icon: RefreshCw,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      format: 'currency'
    },
    {
      title: 'Transferências Recebidas',
      value: totalTransfersIn,
      count: stats.byType.transfer_in?.count || 0,
      icon: ArrowDownCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency'
    },
    {
      title: 'Transferências Enviadas',
      value: totalTransfersOut,
      count: stats.byType.transfer_out?.count || 0,
      icon: ArrowUpCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      format: 'currency'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Card de saldo líquido */}
      <Card className="border-2 border-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                <p className="text-xs text-muted-foreground">
                  (Entradas - Saídas)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netBalance))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {netBalance >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const displayValue = card.format === 'currency' 
            ? formatCurrency(card.value)
            : card.value.toLocaleString('pt-BR');

          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`${card.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {displayValue}
                    </p>
                    {card.count !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.count} {card.count === 1 ? 'transação' : 'transações'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo textual */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRecharges + totalRefunds + totalTransfersIn)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total de Entradas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalPurchases + totalTransfersOut)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total de Saídas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Volume Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(stats.totalAmount / stats.total || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ticket Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob