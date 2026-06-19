import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowRightLeft,
  ArrowRight,
  CreditCard,
  DollarSign,
  User,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de confirmação de transferência
 * Exibe resumo e solicita confirmação antes de processar
 */
export function TransferConfirmation({
  open,
  onOpenChange,
  transferData,
  onConfirm,
  loading = false,
  success = false,
  error = null,
  result = null
}) {
  if (!transferData) return null;

  const { fromCard, toCard, amount, description } = transferData;

  // Calcula novos saldos
  const newFromBalance = fromCard.balance - amount;
  const newToBalance = toCard.balance + amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {success ? 'Transferência Concluída' : 'Confirmar Transferência'}
          </DialogTitle>
          <DialogDescription>
            {success
              ? 'A transferência foi processada com sucesso'
              : 'Revise os dados antes de confirmar a operação'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {success && result && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {result.message || 'Transferência realizada com sucesso!'}
              </AlertDescription>
            </Alert>
          )}

          {/* Cartão de Origem */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cartão de Origem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{fromCard.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{fromCard.uuid}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                <span className="font-bold">{formatCurrency(fromCard.balance)}</span>
              </div>
              {!success && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novo Saldo:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(newFromBalance)}
                  </span>
                </div>
              )}
              {success && result && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novo Saldo:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(result.from_balance)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seta indicando transferência */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <ArrowRight className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-primary">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          {/* Cartão de Destino */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cartão de Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{toCard.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{toCard.uuid}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                <span className="font-bold">{formatCurrency(toCard.balance)}</span>
              </div>
              {!success && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novo Saldo:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(newToBalance)}
                  </span>
                </div>
              )}
              {success && result && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novo Saldo:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(result.to_balance)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descrição */}
          {description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{description}</p>
              </CardContent>
            </Card>
          )}

          {/* IDs das transações (após sucesso) */}
          {success && result && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Detalhes da Operação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transação Saída:</span>
                  <span className="font-mono">{result.transaction_out_id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transação Entrada:</span>
                  <span className="font-mono">{result.transaction_in_id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <span>{new Date().toLocaleString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {!success && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Transferência
              </Button>
            </>
          )}
          {success && (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

