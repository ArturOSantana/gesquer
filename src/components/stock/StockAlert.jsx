import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown,
  RefreshCw,
  Loader2,
  XCircle,
  Edit
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de alertas de estoque baixo
 * Exibe produtos com estoque abaixo do mínimo ou zerado
 */
export function StockAlert({ barracaId = null, onEditProduct }) {
  const { 
    lowStockProducts, 
    loading, 
    error,
    fetchLowStockProducts 
  } = useProducts(barracaId);

  const [refreshing, setRefreshing] = useState(false);

  // Carrega produtos com estoque baixo ao montar
  useEffect(() => {
    fetchLowStockProducts(barracaId);
  }, [barracaId, fetchLowStockProducts]);

  // Atualiza lista
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLowStockProducts(barracaId);
    setRefreshing(false);
  };

  // Separa produtos por criticidade
  const outOfStockProducts = lowStockProducts.filter(p => p.stock_quantity === 0);
  const lowStockOnly = lowStockProducts.filter(p => p.stock_quantity > 0);

  // Calcula estatísticas
  const totalProducts = lowStockProducts.length;
  const totalOutOfStock = outOfStockProducts.length;
  const totalLowStock = lowStockOnly.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertas de Estoque</h2>
          <p className="text-muted-foreground">
            Produtos que precisam de atenção
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
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{totalOutOfStock}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{totalLowStock}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista de produtos sem estoque */}
      {!loading && outOfStockProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Produtos Sem Estoque</h3>
            <Badge variant="destructive">{outOfStockProducts.length}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {outOfStockProducts.map((product) => (
              <Card key={product.id} className="border-destructive/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-destructive" />
                        <h4 className="font-semibold">{product.name}</h4>
                        <Badge variant="destructive">Sem estoque</Badge>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          Preço: {formatCurrency(product.price)}
                        </span>
                        <span className="text-muted-foreground">
                          Mínimo: {product.min_stock} un.
                        </span>
                        {product.barraca_name && (
                          <span className="text-muted-foreground">
                            Barraca: {product.barraca_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {onEditProduct && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditProduct(product)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Reabastecer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de produtos com estoque baixo */}
      {!loading && lowStockOnly.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Produtos com Estoque Baixo</h3>
            <Badge variant="warning">{lowStockOnly.length}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {lowStockOnly.map((product) => {
              const stockPercentage = (product.stock_quantity / product.min_stock) * 100;
              
              return (
                <Card key={product.id} className="border-yellow-500/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-yellow-500" />
                          <h4 className="font-semibold">{product.name}</h4>
                          <Badge variant="warning">Estoque baixo</Badge>
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              Preço: {formatCurrency(product.price)}
                            </span>
                            <span className="text-yellow-600 font-medium">
                              Estoque: {product.stock_quantity} un.
                            </span>
                            <span className="text-muted-foreground">
                              Mínimo: {product.min_stock} un.
                            </span>
                            {product.barraca_name && (
                              <span className="text-muted-foreground">
                                Barraca: {product.barraca_name}
                              </span>
                            )}
                          </div>

                          {/* Barra de progresso */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-yellow-500 transition-all"
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {onEditProduct && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Reabastecer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensagem quando não há alertas */}
      {!loading && lowStockProducts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo certo!</h3>
            <p className="text-muted-foreground text-center">
              Não há produtos com estoque baixo no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Made with Bob