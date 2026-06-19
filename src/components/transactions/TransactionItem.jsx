import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  Calendar,
  User,
  Store,
  Hash
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Componente que exibe uma transação individual
 * Mostra tipo, valor, data e informações relacionadas
 */
export function TransactionItem({ transaction }) {
  // Configuração por tipo de transação
  const transactionConfig = {
    recharge: {
      icon: ArrowUpCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Recarga',
      badgeVariant: 'success',
      amountPrefix: '+'
    },
    purchase: {
      icon: ShoppingCart,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Compra',
      badgeVariant: 'default',
      amountPrefix: '-'
    },
    refund: {
      icon: RefreshCw,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Estorno',
      badgeVariant: 'warning',
      amountPrefix: '+'
    },
    transfer_in: {
      icon: ArrowDownCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Transferência Recebida',
      badgeVariant: 'success',
      amountPrefix: '+'
    },
    transfer_out: {
      icon: ArrowUpCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Transferência Enviada',
      badgeVariant: 'destructive',
      amountPrefix: '-'
    }
  };

  const config = transactionConfig[transaction.type] || transactionConfig.purchase;
  const Icon = config.icon;

  // Formata o valor
  const amount = parseFloat(transaction.amount);
  const isPositive = ['recharge', 'refund', 'transfer_in'].includes(transaction.type);

  return (
    <Card className={`${config.borderColor} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Lado esquerdo - Ícone e informações */}
          <div className="flex items-start gap-3 flex-1">
            {/* Ícone */}
            <div className={`${config.bgColor} p-2 rounded-lg`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>

            {/* Informações */}
            <div className="flex-1 space-y-2">
              {/* Tipo e Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{config.label}</h4>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {transaction.type}
                </Badge>
              </div>

              {/* Descrição */}
              {transaction.description && (
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
              )}

              {/* Detalhes em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {/* Data */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(transaction.created_at)}</span>
                </div>

                {/* ID da transação */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono text-xs">
                    {String(transaction.id).slice(0, 8)}
                  </span>
                </div>

                {/* Cliente */}
                {transaction.card?.client?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{transaction.card.client.name}</span>
                  </div>
                )}

                {/* Cartão */}
                {transaction.card?.uuid && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    <span className="font-mono text-xs">
                      {transaction.card.uuid}
                    </span>
                  </div>
                )}

                {/* Barraca */}
                {transaction.barraca?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Store className="h-3 w-3" />
                    <span>{transaction.barraca.name}</span>
                  </div>
                )}
              </div>

              {/* Saldo anterior e novo */}
              {transaction.previous_balance !== null && transaction.new_balance !== null && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Saldo:</span>
                  <span className="font-mono">
                    {formatCurrency(transaction.previous_balance)}
                  </span>
                  <span>→</span>
                  <span className={`font-mono font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.new_balance)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lado direito - Valor */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {config.amountPrefix}{formatCurrency(Math.abs(amount))}
            </div>
            {transaction.status && (
              <Badge 
                variant={transaction.status === 'completed' ? 'success' : 'secondary'}
                className="mt-2"
              >
                {transaction.status === 'completed' ? 'Concluída' : 
                 transaction.status === 'pending' ? 'Pendente' : 
                 transaction.status === 'cancelled' ? 'Cancelada' : 
                 transaction.status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

