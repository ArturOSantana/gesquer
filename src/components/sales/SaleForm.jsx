import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Plus, Search, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de formulário para adicionar produtos à venda
 */
export function SaleForm({ products, onAddToCart, cartItems }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Filtra produtos disponíveis
  const availableProducts = products.filter(product => 
    product.status === 'active' && 
    product.stock_quantity > 0 &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Verifica quantidade no carrinho
    const itemInCart = cartItems.find(item => item.product_id === selectedProduct.id);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    const availableStock = selectedProduct.stock_quantity - quantityInCart;

    if (quantity > availableStock) {
      alert(`Estoque insuficiente. Disponível: ${availableStock}`);
      return;
    }

    onAddToCart({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      unit_price: selectedProduct.price,
      quantity: quantity,
      stock_quantity: selectedProduct.stock_quantity
    });

    // Limpa seleção
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
  };

  const getAvailableStock = (product) => {
    const itemInCart = cartItems.find(item => item.product_id === product.id);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    return product.stock_quantity - quantityInCart;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Adicionar Produtos</CardTitle>
            <CardDescription>
              Selecione os produtos para a venda
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Busca de produtos */}
        <div className="space-y-2">
          <Label htmlFor="search-product">Buscar Produto</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-product"
              placeholder="Digite o nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de produtos */}
        {searchTerm && (
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
            {availableProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum produto encontrado
                </p>
              </div>
            ) : (
              availableProducts.map(product => {
                const availableStock = getAvailableStock(product);
                const isInCart = cartItems.some(item => item.product_id === product.id);
                
                return (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    } ${availableStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={availableStock === 0}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{product.name}</h4>
                          {isInCart && (
                            <Badge variant="secondary" className="text-xs">
                              No carrinho
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-primary">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {availableStock}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Produto selecionado */}
        {selectedProduct && (
          <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
            <div>
              <h4 className="font-semibold">{selectedProduct.name}</h4>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(selectedProduct.price)} cada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={getAvailableStock(selectedProduct)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1"
                />
                <Button onClick={handleAddToCart} className="min-w-[120px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Disponível: {getAvailableStock(selectedProduct)} unidades
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(selectedProduct.price * quantity)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alerta se não houver produtos */}
        {products.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum produto cadastrado para esta barraca.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta se não houver produtos em estoque */}
        {products.length > 0 && availableProducts.length === 0 && !searchTerm && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum produto disponível em estoque.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Made with Bob
