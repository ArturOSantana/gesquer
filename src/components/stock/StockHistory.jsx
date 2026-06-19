import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Componente de histórico de movimentações de estoque
 * Exibe vendas e ajustes de estoque de produtos
 */
export function StockHistory({ productId = null, barracaId = null }) {
  const { getProductSalesHistory, products, loading, error } = useProducts(barracaId);

  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'sales', 'adjustments'

  // Carrega histórico quando produto é selecionado
  useEffect(() => {
    if (selectedProductId) {
      loadHistory(selectedProductId);
    }
  }, [selectedProductId]);

  // Define produto inicial se fornecido
  useEffect(() => {
    if (productId) {
      setSelectedProductId(productId);
    }
  }, [productId]);

  // Carrega histórico de vendas
  const loadHistory = async (prodId) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const result = await getProductSalesHistory(prodId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Formata dados do histórico
      const formattedHistory = result.data?.map(item => ({
        id: item.id,
        type: 'sale',
        date: item.created_at,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        saleId: item.sale?.id,
        cardUuid: item.sale?.card?.uuid,
        clientName: item.sale?.card?.client?.name,
        status: item.sale?.status
      })) || [];

      setHistory(formattedHistory);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Atualiza histórico
  const handleRefresh = () => {
    if (selectedProductId) {
      loadHistory(selectedProductId);
    }
  };

  // Filtra histórico
  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'sales') return item.type === 'sale';
    if (filter === 'adjustments') return item.type === 'adjustment';
    return true;
  });

  // Calcula estatísticas
  const totalSales = history.filter(h => h.type === 'sale').length;
  const totalQuantitySold = history
    .filter(h => h.type === 'sale')
    .reduce((sum, h) => sum + h.quantity, 0);
  const totalRevenue = history
    .filter(h => h.type === 'sale')
    .reduce((sum, h) => sum + parseFloat(h.subtotal), 0);

  // Produto selecionado
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Movimentações</h2>
          <p className="text-muted-foreground">
            Acompanhe as vendas e ajustes de estoque
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={historyLoading || !selectedProductId}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Seletor de produto */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={loading || productId !== null}
          >
            <SelectTrigger>
              <SelectValue  />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProductId && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="adjustments">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Estatísticas */}
      {selectedProduct && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total de Vendas</span>
              </div>
              <span className="text-2xl font-bold">{totalSales}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Unidades Vendidas</span>
              </div>
              <span className="text-2xl font-bold">{totalQuantitySold}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Receita Total</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Erro */}
      {(error || historyError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || historyError}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {historyLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Mensagem quando nenhum produto selecionado */}
      {!selectedProductId && !historyLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione um produto</h3>
            <p className="text-muted-foreground text-center">
              Escolha um produto acima para ver seu histórico de movimentações
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de histórico */}
      {!historyLoading && selectedProductId && filteredHistory.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação</h3>
            <p className="text-muted-foreground text-center">
              Este produto ainda não possui histórico de movimentações
            </p>
          </CardContent>
        </Card>
      )}

      {!historyLoading && selectedProductId && filteredHistory.length > 0 && (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.type === 'sale' ? (
                        <>
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">Venda</span>
                          <Badge variant="outline">#{item.saleId?.slice(0, 8)}</Badge>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Ajuste Manual</span>
                        </>
                      )}
                      {item.status && (
                        <Badge variant={item.status === 'completed' ? 'success' : 'secondary'}>
                          {item.status === 'completed' ? 'Concluída' : 'Pendente'}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.date)}
                      </div>

                      {item.clientName && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {item.clientName}
                        </div>
                      )}

                      {item.cardUuid && (
                        <div className="text-muted-foreground">
                          Cartão: {item.cardUuid}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === 'sale' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-bold">
                        {item.type === 'sale' ? '-' : '+'}{item.quantity} un.
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

