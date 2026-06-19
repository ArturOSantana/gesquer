import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de carrinho de compras para vendas
 */
export function SaleCart({ items, onUpdateQuantity, onRemoveItem, onClear, onCheckout }) {
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Carrinho</CardTitle>
              <CardDescription>Nenhum item adicionado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Adicione produtos ao carrinho para iniciar a venda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Carrinho</CardTitle>
              <CardDescription>
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate text-sm sm:text-base">{item.name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatCurrency(item.unit_price)} cada
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <Badge variant="secondary" className="min-w-[2rem] sm:min-w-[2.5rem] justify-center text-xs sm:text-sm">
                  {item.quantity}
                </Badge>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock_quantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemoveItem(item.product_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right min-w-[4rem] sm:min-w-[5rem]">
                <p className="font-semibold text-sm sm:text-base">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Resumo */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 sm:flex-row">
        <Button
          onClick={onCheckout}
          className="w-full text-sm sm:text-base"
          size="lg"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          <span className="truncate">Finalizar - {formatCurrency(total)}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

