import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, User, Edit, Trash2, Power, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de card para exibir informações de uma barraca
 */
export function BarracaCard({ barraca, onEdit, onDelete, onToggleStatus, stats }) {
  const isActive = barraca.status === 'active';

  return (
    <Card className={`transition-all hover:shadow-lg ${!isActive ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
              <Store className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
            </div>
            <div>
              <CardTitle className="text-xl">{barraca.name}</CardTitle>
              {barraca.responsible && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {barraca.responsible}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {barraca.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {barraca.description}
          </p>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold">{stats.totalSales || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Produtos Ativos</p>
              <p className="text-lg font-semibold">{stats.activeProducts || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-lg font-semibold">
                {formatCurrency(stats.averageSale || 0)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          Criada em {new Date(barraca.created_at).toLocaleDateString('pt-BR')}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(barraca)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        
        <Button
          variant={isActive ? 'outline' : 'default'}
          size="sm"
          onClick={() => onToggleStatus(barraca.id, barraca.status)}
          className="flex-1"
        >
          <Power className="h-4 w-4 mr-2" />
          {isActive ? 'Desativar' : 'Ativar'}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(barraca.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

