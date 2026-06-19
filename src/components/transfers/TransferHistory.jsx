import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRightLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Componente de histórico de transferências
 * Exibe todas as transferências (enviadas e recebidas)
 */
export function TransferHistory({ cardId = null, limit = 20 }) {
  const { transactions, loading, error, fetchTransactions } = useTransactions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [transferTransactions, setTransferTransactions] = useState([]);

  // Carrega transferências ao montar
  useEffect(() => {
    loadTransfers();
  }, [cardId]);

  // Filtra apenas transferências
  useEffect(() => {
    const transfers = transactions.filter(t => 
      t.type === 'transfer_in' || t.type === 'transfer_out'
    );
    setTransferTransactions(transfers);
  }, [transactions]);

  // Carrega transferências
  const loadTransfers = async () => {
    const filters = {
      limit: limit * 2 // Carrega mais para garantir que temos transferências suficientes
    };

    if (cardId) {
      filters.card_id = cardId;
    }

    await fetchTransactions(filters);
  };

  // Atualiza lista
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransfers();
    setRefreshing(false);
  };

  // Separa transferências por tipo
  const transfersOut = transferTransactions.filter(t => t.type === 'transfer_out');
  const transfersIn = transferTransactions.filter(t => t.type === 'transfer_in');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Transferências</h2>
          <p className="text-muted-foreground">
            {transferTransactions.length} {transferTransactions.length === 1 ? 'transferência encontrada' : 'transferências encontradas'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{transferTransactions.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transferências Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{transfersOut.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(transfersOut.reduce((sum, t) => sum + parseFloat(t.amount), 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transferências Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{transfersIn.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(transfersIn.reduce((sum, t) => sum + parseFloat(t.amount), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista vazia */}
      {!loading && transferTransactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transferência encontrada</h3>
            <p className="text-muted-foreground text-center">
              Ainda não há transferências registradas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de transferências */}
      {!loading && transferTransactions.length > 0 && (
        <div className="space-y-3">
          {transferTransactions.map((transfer) => {
            const isOut = transfer.type === 'transfer_out';
            const Icon = isOut ? ArrowUpCircle : ArrowDownCircle;
            const colorClass = isOut ? 'text-red-600' : 'text-green-600';
            const bgClass = isOut ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
            const label = isOut ? 'Transferência Enviada' : 'Transferência Recebida';

            return (
              <Card key={transfer.id} className={`${bgClass} border-l-4`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Lado esquerdo */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${isOut ? 'bg-red-100' : 'bg-green-100'} p-2 rounded-lg`}>
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{label}</h4>
                          <Badge variant={isOut ? 'destructive' : 'success'} className="text-xs">
                            {transfer.type}
                          </Badge>
                        </div>

                        {transfer.description && (
                          <p className="text-sm text-muted-foreground">
                            {transfer.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(transfer.created_at)}</span>
                          </div>

                          {transfer.card?.client?.name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{transfer.card.client.name}</span>
                            </div>
                          )}

                          {transfer.card?.uuid && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono text-xs">
                                {transfer.card.uuid}
                              </span>
                            </div>
                          )}
                        </div>

                        {transfer.previous_balance !== null && transfer.new_balance !== null && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Saldo:</span>
                            <span className="font-mono">
                              {formatCurrency(transfer.previous_balance)}
                            </span>
                            <span>→</span>
                            <span className={`font-mono font-semibold ${colorClass}`}>
                              {formatCurrency(transfer.new_balance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lado direito - Valor */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colorClass}`}>
                        {isOut ? '-' : '+'}{formatCurrency(Math.abs(parseFloat(transfer.amount)))}
                      </div>
                      {transfer.status && (
                        <Badge 
                          variant={transfer.status === 'completed' ? 'success' : 'secondary'}
                          className="mt-2"
                        >
                          {transfer.status === 'completed' ? 'Concluída' : 
                           transfer.status === 'pending' ? 'Pendente' : 
                           transfer.status === 'cancelled' ? 'Cancelada' : 
                           transfer.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Made with Bob