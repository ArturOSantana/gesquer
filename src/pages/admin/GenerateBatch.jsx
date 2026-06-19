import { useState, useEffect } from 'react';
import { BatchGenerator } from '../../components/cards/BatchGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useBatch } from '../../hooks/useBatch';

export default function GenerateBatch() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const { loading, getBatches, getBatchDetails, cancelBatch } = useBatch();

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const result = await getBatches();
    if (result.success) {
      setBatches(result.batches);
    }
  };

  const handleViewBatch = async (batchId) => {
    const result = await getBatchDetails(batchId);
    if (result.success) {
      setSelectedBatch(result);
    }
  };

  const handleCancelBatch = async (batchId) => {
    if (confirm('Tem certeza que deseja cancelar este lote?')) {
      const result = await cancelBatch(batchId);
      if (result.success) {
        loadBatches();
        setSelectedBatch(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      used: 'secondary',
      cancelled: 'destructive'
    };

    const labels = {
      active: 'Ativo',
      used: 'Usado',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Geração de Lote de Cartões
        </h1>
        <p className="text-gray-600 mt-2">
          Crie e gerencie lotes de cartões pré-pagos para impressão
        </p>
      </div>

      <BatchGenerator />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lotes</CardTitle>
          <CardDescription>
            Visualize e gerencie os lotes de cartões gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando lotes...
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum lote gerado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {batch.batch_code}
                        </h3>
                        {getStatusBadge(batch.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Quantidade:</span>
                          <p className="font-medium">{batch.quantity} cartões</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Gerado por:</span>
                          <p className="font-medium">{batch.generated_by}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Data:</span>
                          <p className="font-medium">
                            {new Date(batch.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Hora:</span>
                          <p className="font-medium">
                            {new Date(batch.created_at).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {batch.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {batch.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBatch(batch.id)}
                      >
                        Ver Detalhes
                      </Button>
                      {batch.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelBatch(batch.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBatch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detalhes do Lote</CardTitle>
                <CardDescription>
                  {selectedBatch.batch.batch_code}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedBatch(null)}
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total de Cartões:</span>
                  <p className="font-medium text-lg">
                    {selectedBatch.cards.length}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Ativos:</span>
                  <p className="font-medium text-lg text-green-600">
                    {selectedBatch.cards.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Pendentes:</span>
                  <p className="font-medium text-lg text-yellow-600">
                    {selectedBatch.cards.filter(c => c.status === 'pending').length}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Inativos:</span>
                  <p className="font-medium text-lg text-gray-600">
                    {selectedBatch.cards.filter(c => c.status === 'inactive').length}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Cartões do Lote</h4>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">UUID</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Saldo</th>
                        <th className="px-4 py-2 text-left">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatch.cards.map((card) => (
                        <tr key={card.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{card.id}</td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {card.uuid.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-2">
                            {getStatusBadge(card.status)}
                          </td>
                          <td className="px-4 py-2">
                            R$ {card.balance.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(card.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
