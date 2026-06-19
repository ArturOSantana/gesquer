import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Download, FileText, TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useBarracas } from '../hooks/useBarracas';

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBarraca, setSelectedBarraca] = useState('all');
  const [reportType, setReportType] = useState('sales');

  const { transactions, loading: loadingTransactions } = useTransactions();
  const { barracas } = useBarracas();

  const exportToCSV = () => {
    const filtered = filterTransactions();
    const headers = ['Data', 'Tipo', 'Valor', 'Barraca', 'Cliente', 'ID Cartão'];
    const rows = filtered.map(t => [
      new Date(t.created_at).toLocaleString('pt-BR'),
      t.type,
      t.amount,
      t.barracas?.name || 'N/A',
      t.cards?.client?.name || 'N/A',
      t.cards?.id ? String(t.cards.id).substring(0, 8) : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${reportType}_${Date.now()}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const filtered = filterTransactions();
    const jsonContent = JSON.stringify(filtered, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${reportType}_${Date.now()}.json`;
    link.click();
  };

  const filterTransactions = () => {
    if (!transactions) return [];

    let filtered = [...transactions];

    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.created_at) <= new Date(dateTo));
    }

    if (selectedBarraca !== 'all') {
      filtered = filtered.filter(t => t.barraca_id === selectedBarraca);
    }

    return filtered;
  };

  const calculateStats = () => {
    const filtered = filterTransactions();
    const sales = filtered.filter(t => t.type === 'sale');
    
    return {
      totalTransactions: filtered.length,
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, t) => sum + t.amount, 0),
      averageTicket: sales.length > 0 ? sales.reduce((sum, t) => sum + t.amount, 0) / sales.length : 0,
    };
  };

  const stats = calculateStats();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Análises detalhadas e exportação de dados
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Configure os filtros para gerar relatórios personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="barraca">Barraca</Label>
              <Select value={selectedBarraca} onValueChange={setSelectedBarraca}>
                <SelectTrigger id="barraca">
                  <SelectValue placeholder="Todas as barracas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as barracas</SelectItem>
                  {barracas?.map((barraca) => (
                    <SelectItem key={barraca.id} value={barraca.id}>
                      {barraca.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setSelectedBarraca('all');
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.averageTicket)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>Análise detalhada de vendas por período</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Barraca</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterTransactions().slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {new Date(transaction.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-2 capitalize">{transaction.type}</td>
                        <td className="p-2">{transaction.barracas?.name || 'N/A'}</td>
                        <td className="p-2">
                          {transaction.cards?.client?.name || 'N/A'}
                          <span className="text-xs text-muted-foreground ml-2">
                            {transaction.cards?.id ? `(${String(transaction.cards.id).substring(0, 8)}...)` : ''}
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filterTransactions().length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Mostrando 10 de {filterTransactions().length} transações. 
                  Exporte para ver todos os dados.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob
