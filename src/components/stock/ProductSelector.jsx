import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Package, 
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';

/**
 * Seletor de produtos para vendas
 * Permite buscar e selecionar produtos com verificação de estoque
 */
export function ProductSelector({ 
  open, 
  onOpenChange, 
  onSelectProduct,
  barracaId = null 
}) {
  const { 
    products, 
    loading, 
    error,
    fetchActiveProducts,
    checkStock
  } = useProducts(barracaId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [stockError, setStockError] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);

  // Carrega produtos ativos ao abrir
  useEffect(() => {
    if (open) {
      fetchActiveProducts(barracaId);
      setSearchTerm('');
      setSelectedProduct(null);
      setQuantity(1);
      setStockError(null);
    }
  }, [open, barracaId, fetchActiveProducts]);

  // Filtra produtos pela busca
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Seleciona produto
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setStockError(null);
  };

  // Valida e adiciona produto ao carrinho
  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    setCheckingStock(true);
    setStockError(null);

    try {
      // Verifica estoque disponível
      const stockCheck = await checkStock(selectedProduct.id, quantity);

      if (!stockCheck.available) {
        setStockError(stockCheck.message);
        setCheckingStock(false);
        return;
      }

      // Adiciona ao carrinho
      onSelectProduct({
        product: selectedProduct,
        quantity: quantity,
        subtotal: selectedProduct.price * quantity
      });

      // Reseta seleção
      setSelectedProduct(null);
      setQuantity(1);
      setStockError(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      setStockError('Erro ao verificar estoque');
    } finally {
      setCheckingStock(false);
    }
  };

  // Calcula subtotal
  const subtotal = selectedProduct ? selectedProduct.price * quantity : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
          <DialogDescription>
            Busque e selecione um produto para adicionar à venda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Erro geral */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Lista de produtos */}
          {!loading && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
                  const hasLowStock = product.stock_quantity <= product.min_stock;
                  const isOutOfStock = product.stock_quantity === 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => !isOutOfStock && handleSelectProduct(product)}
                      disabled={isOutOfStock}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            {isOutOfStock && (
                              <Badge variant="destructive">Sem estoque</Badge>
                            )}
                            {!isOutOfStock && hasLowStock && (
                              <Badge variant="warning">Estoque baixo</Badge>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-primary">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-muted-foreground">
                              Estoque: {product.stock_quantity} un.
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Seleção de quantidade */}
          {selectedProduct && (
            <div className="border-t pt-4 space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Produto Selecionado</h4>
                <p className="text-sm">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(selectedProduct.price)} por unidade
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.stock_quantity}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, value), selectedProduct.stock_quantity));
                    setStockError(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Disponível: {selectedProduct.stock_quantity} unidades
                </p>
              </div>

              {/* Erro de estoque */}
              {stockError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{stockError}</AlertDescription>
                </Alert>
              )}

              {/* Subtotal */}
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <span className="font-semibold">Subtotal</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProduct(null);
                    setQuantity(1);
                    setStockError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={checkingStock || !quantity || quantity < 1}
                >
                  {checkingStock ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

