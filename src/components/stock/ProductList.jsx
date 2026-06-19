import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Filter,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useBarracas } from '@/hooks/useBarracas';

/**
 * Lista de produtos com busca, filtros e ações
 * Permite criar, editar, excluir e gerenciar produtos
 */
export function ProductList({ barracaId = null, showStats = false }) {
  const { 
    products, 
    loading, 
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus
  } = useProducts(barracaId);

  const { barracas, fetchActiveBarracas } = useBarracas();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barracaFilter, setBarracaFilter] = useState(barracaId || 'all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Carrega barracas para o filtro
  useEffect(() => {
    fetchActiveBarracas();
  }, [fetchActiveBarracas]);

  // Filtra produtos
  const filteredProducts = products.filter(product => {
    // Filtro de busca
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro de status
    if (statusFilter !== 'all' && product.status !== statusFilter) {
      return false;
    }

    // Filtro de barraca
    if (barracaFilter !== 'all' && product.barraca_id !== barracaFilter) {
      return false;
    }

    // Filtro de estoque
    if (stockFilter === 'low' && product.stock_quantity > product.min_stock) {
      return false;
    }
    if (stockFilter === 'out' && product.stock_quantity > 0) {
      return false;
    }

    return true;
  });

  // Abre formulário para criar produto
  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  // Abre formulário para editar produto
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Submete formulário (criar ou editar)
  const handleSubmit = async (productData) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);
        if (result.error) {
          throw new Error(result.error);
        }
      } else {
        const result = await createProduct(productData);
        if (result.error) {
          throw new Error(result.error);
        }
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Deleta produto
  const handleDelete = async (productId) => {
    const result = await deleteProduct(productId);
    if (result.error) {
      alert(result.error);
    }
  };

  // Alterna status do produto
  const handleToggleStatus = async (productId, currentStatus) => {
    await toggleProductStatus(productId, currentStatus);
  };

  // Limpa filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBarracaFilter(barracaId || 'all');
    setStockFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com busca e ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botão Novo Produto */}
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        {/* Filtro de Status */}
        <div className="w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Barraca (se não estiver filtrado por barraca) */}
        {!barracaId && (
          <div className="w-full sm:w-auto">
            <Select value={barracaFilter} onValueChange={setBarracaFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Barraca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as barracas</SelectItem>
                {barracas.map((barraca) => (
                  <SelectItem key={barraca.id} value={barraca.id}>
                    {barraca.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtro de Estoque */}
        <div className="w-full sm:w-auto">
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estoques</SelectItem>
              <SelectItem value="low">Estoque baixo</SelectItem>
              <SelectItem value="out">Sem estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão Limpar Filtros */}
        {(searchTerm || statusFilter !== 'all' || barracaFilter !== 'all' || stockFilter !== 'all') && (
          <Button variant="outline" onClick={handleClearFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista de produtos */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || barracaFilter !== 'all' || stockFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro produto'}
          </p>
          {!searchTerm && statusFilter === 'all' && barracaFilter === 'all' && stockFilter === 'all' && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Produto
            </Button>
          )}
        </div>
      )}

      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              showStats={showStats}
            />
          ))}
        </div>
      )}

      {/* Formulário de produto */}
      <ProductForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        product={editingProduct}
        loading={formLoading}
      />
    </div>
  );
}

// Made with Bob