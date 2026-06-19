import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, CreditCard, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de confirmação de venda
 */
export function SaleConfirmation({ 
  card, 
  barraca, 
  items, 
  total,
  onConfirm, 
  onCancel,
  loading,
  error
}) {
  const hasBalance = card && card.balance >= total;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasBalance ? 'bg-green-100' : 'bg-red-100'}`}>
            {hasBalance ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div>
            <CardTitle>Confirmar Venda</CardTitle>
            <CardDescription>
              Revise os detalhes antes de finalizar
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Informações do Cartão */}
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cartão
          </h3>
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{card?.client?.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cartão: {card?.uuid?.slice(0, 8)}...
                </p>
              </div>
              <Badge variant={card?.status === 'active' ? 'default' : 'secondary'} className="self-start sm:self-auto">
                {card?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs sm:text-sm text-muted-foreground">Saldo Atual:</span>
              <span className={`text-base sm:text-lg font-bold ${hasBalance ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(card?.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Barraca */}
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Barraca
          </h3>
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <p className="font-medium text-sm sm:text-base">{barraca?.name}</p>
            {barraca?.responsible && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Responsável: {barraca.responsible}
              </p>
            )}
          </div>
        </div>

        {/* Itens da Venda */}
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-semibold">Itens da Venda</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold text-sm sm:text-base self-start sm:self-auto">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-3 p-3 sm:p-4 rounded-lg border bg-accent/50">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
            <span>Total a Pagar:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm pt-2 border-t">
            <span className="text-muted-foreground">Saldo Após Venda:</span>
            <span className={hasBalance ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {formatCurrency((card?.balance || 0) - total)}
            </span>
          </div>
        </div>

        {/* Alertas */}
        {!hasBalance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Saldo insuficiente. Faltam {formatCurrency(total - (card?.balance || 0))} para completar a compra.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {hasBalance && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Saldo suficiente para completar a compra.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:flex-1 text-sm sm:text-base"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!hasBalance || loading}
          className="w-full sm:flex-1 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Processando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span className="truncate">Confirmar Venda</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

