import { useState } from 'react';
import { BarracaCard } from './BarracaCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Store, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Componente de lista de barracas com busca e filtros
 */
export function BarracaList({ 
  barracas, 
  loading, 
  error,
  onEdit, 
  onDelete, 
  onToggleStatus,
  onAdd,
  showStats = false,
  getBarracaStats
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barracaStats, setBarracaStats] = useState({});

  // Filtra barracas
  const filteredBarracas = barracas.filter(barraca => {
    const matchesSearch = barraca.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barraca.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barraca.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || barraca.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Carrega estatísticas de uma barraca
  const loadStats = async (barracaId) => {
    if (!getBarracaStats || barracaStats[barracaId]) return;
    
    const { data } = await getBarracaStats(barracaId);
    if (data) {
      setBarracaStats(prev => ({
        ...prev,
        [barracaId]: data
      }));
    }
  };

  // Carrega estatísticas ao renderizar se necessário
  if (showStats && getBarracaStats) {
    filteredBarracas.forEach(barraca => {
      if (!barracaStats[barraca.id]) {
        loadStats(barraca.id);
      }
    });
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar barracas: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">Todos os Status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
        </select>

        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Barraca
          </Button>
        )}
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total de Barracas</p>
          <p className="text-2xl font-bold">{barracas.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Barracas Ativas</p>
          <p className="text-2xl font-bold text-green-600">
            {barracas.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Barracas Inativas</p>
          <p className="text-2xl font-bold text-gray-500">
            {barracas.filter(b => b.status === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista de barracas */}
      {!loading && filteredBarracas.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhuma barraca encontrada' 
              : 'Nenhuma barraca cadastrada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando sua primeira barraca'}
          </p>
          {onAdd && !searchTerm && statusFilter === 'all' && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Barraca
            </Button>
          )}
        </div>
      )}

      {!loading && filteredBarracas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarracas.map(barraca => (
            <BarracaCard
              key={barraca.id}
              barraca={barraca}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              stats={showStats ? barracaStats[barraca.id] : null}
            />
          ))}
        </div>
      )}

      {/* Contador de resultados */}
      {!loading && filteredBarracas.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredBarracas.length} de {barracas.length} barraca(s)
        </p>
      )}
    </div>
  );
}

