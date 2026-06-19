import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, 
  Download, 
  FileText,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

export default function TransactionHistory() {
  const { transactions, getTransactionStats } = useTransactions();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [exporting, setExporting] = useState(false);

  const stats = getTransactionStats(transactions);

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      if (transactions.length === 0) {
        toast({
          title: 'Nenhuma transação',
          description: 'Não há transações para exportar',
          variant: 'destructive'
        });
        return;
      }

      const csvHeaders = [
        'ID',
        'Data/Hora',
        'Tipo',
        'Valor',
        'Descrição',
        'Cartão',
        'Cliente',
        'Barraca',
        'Saldo Anterior',
        'Novo Saldo',
        'Status'
      ];

      const csvRows = transactions.map(t => [
        t.id,
        new Date(t.created_at).toLocaleString('pt-BR'),
        t.type,
        t.amount,
        t.description || '',
        t.card?.uuid || '',
        t.card?.client?.name || '',
        t.barraca?.name || '',
        t.previous_balance || '',
        t.new_balance || '',
        t.status || 'completed'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportação concluída',
        description: `${transactions.length} transações exportadas com sucesso`
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro na exportação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setExporting(true);

      if (transactions.length === 0) {
        toast({
          title: 'Nenhuma transação',
          description: 'Não há transações para exportar',
          variant: 'destructive'
        });
        return;
      }

      const report = {
        generated_at: new Date().toISOString(),
        period: {
          start: transactions.length > 0 ? transactions[transactions.length - 1].created_at : null,
          end: transactions.length > 0 ? transactions[0].created_at : null
        },
        statistics: stats,
        transactions: transactions
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_transacoes_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Relatório exportado',
        description: 'Relatório JSON gerado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro na exportação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Histórico de Transações
          </h1>
          <p className="text-muted-foreground">
            Visualize e exporte todas as transações do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting || transactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={exporting || transactions.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatório JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recargas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byType.recharge?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {(stats.byType.recharge?.amount || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.byType.purchase?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {(stats.byType.purchase?.amount || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(stats.byType.transfer_in?.count || 0) + (stats.byType.transfer_out?.count || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enviadas e recebidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Todas</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Recentes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>
                Histórico completo com filtros avançados e paginação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList 
                showFilters={true}
                showSummary={true}
                limit={20}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Últimas 24 horas de atividade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList 
                showFilters={false}
                showSummary={true}
                limit={50}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Made with Bob
