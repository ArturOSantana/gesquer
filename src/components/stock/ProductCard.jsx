import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/utils';

/**
 * Card de produto com informações e ações
 * Exibe dados do produto, status de estoque e permite edição/exclusão
 */
export function ProductCard({ product, onEdit, onDelete, onToggleStatus, showStats = false }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calcula status do estoque
  const getStockStatus = () => {
    if (product.stock_quantity === 0) {
      return { label: 'Sem estoque', color: 'destructive', icon: XCircle };
    }
    if (product.stock_quantity <= product.min_stock) {
      return { label: 'Estoque baixo', color: 'warning', icon: AlertTriangle };
    }
    return { label: 'Estoque OK', color: 'success', icon: CheckCircle };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  // Calcula porcentagem do estoque
  const stockPercentage = product.min_stock > 0 
    ? Math.min((product.stock_quantity / (product.min_stock * 2)) * 100, 100)
    : 100;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(product.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${product.status === 'inactive' ? 'opacity-60' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {product.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {product.description || 'Sem descrição'}
              </CardDescription>
            </div>
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
              {product.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Preço */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Preço</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
          </div>

          {/* Status do Estoque */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StockIcon className={`h-5 w-5 ${
                  stockStatus.color === 'destructive' ? 'text-destructive' :
                  stockStatus.color === 'warning' ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
                <span className="text-sm font-medium">{stockStatus.label}</span>
              </div>
              <span className="text-sm font-bold">
                {product.stock_quantity} un.
              </span>
            </div>

            {/* Barra de progresso do estoque */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stockStatus.color === 'destructive' ? 'bg-destructive' :
                  stockStatus.color === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mínimo: {product.min_stock}</span>
              {product.stock_quantity <= product.min_stock && (
                <span className="text-yellow-600 font-medium">
                  Reabastecer!
                </span>
              )}
            </div>
          </div>

          {/* Barraca */}
          {product.barraca && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Barraca:</span> {product.barraca.name}
            </div>
          )}

          {/* Estatísticas (opcional) */}
          {showStats && product.stats && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">Vendidos</div>
                <div className="text-lg font-bold">{product.stats.totalQuantitySold}</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">Receita</div>
                <div className="text-lg font-bold">
                  {formatCurrency(product.stats.totalRevenue)}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <Button
            variant={product.status === 'active' ? 'outline' : 'default'}
            size="sm"
            className="flex-1"
            onClick={() => onToggleStatus(product.id, product.status)}
          >
            {product.status === 'active' ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativar
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto <strong>{product.name}</strong>?
              Esta ação não pode ser desfeita.
              {product.stock_quantity > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Este produto ainda tem {product.stock_quantity} unidades em estoque.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

