import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Package, Plus, Minus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente para ajuste manual de estoque
 * Permite adicionar ou remover unidades do estoque com justificativa
 */
export function StockAdjustment({ 
  open, 
  onOpenChange, 
  product = null,
  onSuccess 
}) {
  const { updateStock, loading } = useProducts();

  const [operation, setOperation] = useState('add'); // 'add' ou 'subtract'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Reseta formulário ao abrir/fechar
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setOperation('add');
      setQuantity('');
      setReason('');
      setErrors({});
      setSubmitError(null);
    }
    onOpenChange(isOpen);
  };

  // Valida formulário
  const validateForm = () => {
    const newErrors = {};

    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (operation === 'subtract' && product) {
      if (qty > product.stock_quantity) {
        newErrors.quantity = `Quantidade não pode ser maior que o estoque atual (${product.stock_quantity})`;
      }
    }

    if (!reason.trim()) {
      newErrors.reason = 'Justificativa é obrigatória';
    } else if (reason.trim().length < 5) {
      newErrors.reason = 'Justificativa deve ter pelo menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submete ajuste
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product) return;
    if (!validateForm()) return;

    try {
      setSubmitError(null);

      const qty = parseInt(quantity);
      const result = await updateStock(product.id, qty, operation);

      if (result.error) {
        throw new Error(result.error);
      }

      // Callback de sucesso
      if (onSuccess) {
        onSuccess({
          product: product,
          operation: operation,
          quantity: qty,
          reason: reason.trim(),
          newStock: result.data.stock_quantity
        });
      }

      // Fecha dialog
      handleOpenChange(false);
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      setSubmitError(error.message || 'Erro ao ajustar estoque');
    }
  };

  // Calcula novo estoque
  const calculateNewStock = () => {
    if (!product || !quantity) return null;
    const qty = parseInt(quantity);
    if (isNaN(qty)) return null;

    if (operation === 'add') {
      return product.stock_quantity + qty;
    } else {
      return Math.max(0, product.stock_quantity - qty);
    }
  };

  const newStock = calculateNewStock();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Adicione ou remova unidades do estoque manualmente
          </DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações do produto */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">{product.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Estoque Atual:</span>
                  <span className="ml-2 font-bold">{product.stock_quantity} un.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="ml-2 font-bold">{formatCurrency(product.price)}</span>
                </div>
              </div>
            </div>

            {/* Erro geral */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Tipo de operação */}
            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={operation === 'add' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => {
                    setOperation('add');
                    setErrors({});
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant={operation === 'subtract' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => {
                    setOperation('subtract');
                    setErrors({});
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={operation === 'subtract' ? product.stock_quantity : undefined}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (errors.quantity) {
                    setErrors(prev => ({ ...prev, quantity: null }));
                  }
                }}
                
                disabled={loading}
                className={errors.quantity ? 'border-destructive' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Justificativa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors(prev => ({ ...prev, reason: null }));
                  }
                }}
                
                disabled={loading}
                className={errors.reason ? 'border-destructive' : ''}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Descreva o motivo do ajuste para registro
              </p>
            </div>

            {/* Preview do novo estoque */}
            {newStock !== null && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Novo Estoque:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {product.stock_quantity}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-xl font-bold text-primary">
                      {newStock} un.
                    </span>
                  </div>
                </div>
                {operation === 'subtract' && newStock === 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Atenção: O produto ficará sem estoque
                  </p>
                )}
                {newStock <= product.min_stock && newStock > 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Atenção: O estoque ficará abaixo do mínimo ({product.min_stock})
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Ajuste
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

