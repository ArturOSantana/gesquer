import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  AlertTriangle, 
  History,
  Settings,
  Download,
  BarChart3
} from 'lucide-react';
import { ProductList } from '@/components/stock/ProductList';
import { StockAlert } from '@/components/stock/StockAlert';
import { StockHistory } from '@/components/stock/StockHistory';
import { StockAdjustment } from '@/components/stock/StockAdjustment';
import { useProducts } from '@/hooks/useProducts';

/**
 * Página de Gestão de Estoque e Produtos
 * Gerencia produtos, estoque, alertas e histórico
 */
export default function StockManagement() {
  const { products, lowStockProducts } = useProducts();
  const [activeTab, setActiveTab] = useState('products');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Abre ajuste de estoque
  const handleOpenAdjustment = (product) => {
    setSelectedProduct(product);
    setShowAdjustment(true);
  };

  // Callback após ajuste bem-sucedido
  const handleAdjustmentSuccess = (adjustment) => {
    console.log('Ajuste realizado:', adjustment);
    // Aqui você pode adicionar lógica adicional, como mostrar notificação
  };

  // Calcula estatísticas
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie produtos, estoque e movimentações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalProducts}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProducts} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{lowStockCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos com estoque baixo
            </p>
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
              <Package className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{outOfStockCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos zerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                R$ {products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total do estoque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                {lowStockCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Lista de Produtos */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Gerencie todos os produtos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList showStats={false} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Alertas de Estoque */}
        <TabsContent value="alerts" className="space-y-4">
          <StockAlert onEditProduct={handleOpenAdjustment} />
        </TabsContent>

        {/* Tab 3: Histórico de Movimentações */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Acompanhe todas as movimentações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockHistory />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Ajustes Manuais */}
        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajustes Manuais de Estoque</CardTitle>
              <CardDescription>
                Selecione um produto para realizar ajustes manuais de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList showStats={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Ajuste de Estoque */}
      <StockAdjustment
        open={showAdjustment}
        onOpenChange={setShowAdjustment}
        product={selectedProduct}
        onSuccess={handleAdjustmentSuccess}
      />

      {/* Ações rápidas flutuantes (opcional) */}
      {lowStockCount > 0 && activeTab !== 'alerts' && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="shadow-lg"
            onClick={() => setActiveTab('alerts')}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            {lowStockCount} {lowStockCount === 1 ? 'Alerta' : 'Alertas'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Made with Bob
