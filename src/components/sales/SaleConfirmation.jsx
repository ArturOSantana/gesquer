import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, CreditCard, ShoppingCart, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de confirmação de venda
 * Exibe resumo completo e validações antes de processar
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
  // Validações
  const currentBalance = card?.balance || 0;
  const newBalance = currentBalance - total;
  const hasBalance = currentBalance >= total;
  const hasSufficientBalance = newBalance >= 0;
  
  // Validação de dados
  const isValid = card && barraca && items && items.length > 0 && total > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasSufficientBalance ? 'bg-green-100' : 'bg-red-100'}`}>
            {hasSufficientBalance ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl">Confirmar Venda</CardTitle>
            <CardDescription>
              Revise cuidadosamente os detalhes antes de finalizar
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

        {/* Resumo Financeiro Detalhado */}
        <div className="space-y-3 p-4 sm:p-5 rounded-lg border-2 bg-accent/30">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-muted-foreground font-medium">Saldo Atual:</span>
            <span className="font-bold text-lg">{formatCurrency(currentBalance)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm sm:text-base pt-2 border-t">
            <span className="text-muted-foreground font-medium">Total da Compra:</span>
            <span className="font-bold text-lg text-primary">{formatCurrency(total)}</span>
          </div>
          
          <div className={`flex justify-between items-center text-base sm:text-lg font-bold pt-3 border-t-2 ${
            hasSufficientBalance ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>Novo Saldo:</span>
            <span className="text-xl sm:text-2xl">
              {formatCurrency(newBalance)}
            </span>
          </div>

          {/* Indicador visual de saldo */}
          <div className="pt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hasSufficientBalance ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (newBalance / currentBalance) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Alertas e Validações */}
        <div className="space-y-3">
          {!isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Dados inválidos. Verifique o cartão, barraca e itens selecionados.
              </AlertDescription>
            </Alert>
          )}

          {!hasSufficientBalance && isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                ⚠️ Saldo Insuficiente! Faltam {formatCurrency(Math.abs(newBalance))} para completar a compra.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {hasSufficientBalance && isValid && !error && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Saldo suficiente. A venda pode ser processada.
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-800">
                Processando venda... Aguarde e não feche esta janela.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:flex-1 text-sm sm:text-base py-6"
          size="lg"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!hasSufficientBalance || !isValid || loading}
          className="w-full sm:flex-1 text-sm sm:text-base py-6"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="truncate">Processando Venda...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              <span className="truncate">Confirmar e Finalizar</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

