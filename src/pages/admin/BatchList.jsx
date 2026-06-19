import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter, Layers } from 'lucide-react';
import { useBatch } from '../../hooks/useBatch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function getStatusLabel(status) {
  const labels = {
    active: 'Ativo',
    used: 'Utilizado',
    cancelled: 'Cancelado',
  };

  return labels[status] || status;
}

export default function BatchList() {
  const { loading, error, getBatches } = useBatch();
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    createdBy: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async (customFilters = filters) => {
    const result = await getBatches(customFilters);

    if (result.success) {
      setBatches(result.batches);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await loadBatches(filters);
  };

  const handleClearFilters = async () => {
    const clearedFilters = {
      createdBy: '',
      dateFrom: '',
      dateTo: '',
    };

    setFilters(clearedFilters);
    await loadBatches(clearedFilters);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Lotes de Cartões</h1>
        <p className="text-gray-600">
          Visualize todos os lotes criados, com ordenação por mais recentes primeiro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os lotes por criador e intervalo de datas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyFilters} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="createdBy">Criador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="createdBy"
                  value={filters.createdBy}
                  onChange={(event) => handleFilterChange('createdBy', event.target.value)}
                  placeholder="Nome ou identificador"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Data final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(event) => handleFilterChange('dateTo', event.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                Aplicar
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters} disabled={loading}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Lotes</CardTitle>
          <CardDescription>
            {batches.length} lote(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando lotes...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : batches.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Nenhum lote encontrado com os filtros informados.
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          Lote #{batch.id} · {batch.batch_code}
                        </h3>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <span className="text-gray-500">Criado em</span>
                          <p className="font-medium">{formatDateTime(batch.created_at)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantidade</span>
                          <p className="font-medium">{batch.cards_count} cartões</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Criador</span>
                          <p className="font-medium">{batch.creator_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status</span>
                          <p className="font-medium">{getStatusLabel(batch.status)}</p>
                        </div>
                      </div>

                      {batch.description && (
                        <p className="text-sm text-gray-600">{batch.description}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button asChild variant="outline" className="gap-2">
                        <Link to={`/admin/batches/${batch.id}`}>
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob