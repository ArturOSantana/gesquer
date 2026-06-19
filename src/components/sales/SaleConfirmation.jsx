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

      <CardContent className="space-y-6">
        {/* Informações do Cartão */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cartão
          </h3>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">{card?.client?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Cartão: {card?.uuid?.slice(0, 8)}...
                </p>
              </div>
              <Badge variant={card?.status === 'active' ? 'default' : 'secondary'}>
                {card?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Saldo Atual:</span>
              <span className={`text-lg font-bold ${hasBalance ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(card?.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Barraca */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Barraca
          </h3>
          <div className="p-4 rounded-lg border bg-card">
            <p className="font-medium">{barraca?.name}</p>
            {barraca?.responsible && (
              <p className="text-sm text-muted-foreground">
                Responsável: {barraca.responsible}
              </p>
            )}
          </div>
        </div>

        {/* Itens da Venda */}
        <div className="space-y-2">
          <h3 className="font-semibold">Itens da Venda</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-3 p-4 rounded-lg border bg-accent/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total a Pagar:</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
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

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!hasBalance || loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Venda
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Made with Bob
