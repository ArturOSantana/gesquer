import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TransactionItem } from './TransactionItem';
import { TransactionFilter } from './TransactionFilter';
import { TransactionSummary } from './TransactionSummary';
import { useTransactions } from '@/hooks/useTransactions';

/**
 * Lista de transações com filtros e paginação
 * Exibe histórico completo de transações do sistema
 */
export function TransactionList({ 
  cardId = null, 
  barracaId = null,
  showFilters = true,
  showSummary = true,
  limit = 20
}) {
  const { 
    transactions, 
    loading, 
    error,
    fetchTransactions,
    getTransactionsByCard,
    getTransactionsByBarraca,
    getTransactionStats
  } = useTransactions();

  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: '',
    card_id: cardId || '',
    barraca_id: barracaId || ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(limit);
  const [refreshing, setRefreshing] = useState(false);

  // Carrega transações ao montar ou quando filtros mudam
  useEffect(() => {
    loadTransactions();
  }, [cardId, barracaId]);

  // Carrega transações
  const loadTransactions = async () => {
    if (cardId) {
      await getTransactionsByCard(cardId, itemsPerPage * 5); // Carrega mais para paginação
    } else if (barracaId) {
      await getTransactionsByBarraca(barracaId, { limit: itemsPerPage * 5 });
    } else {
      await fetchTransactions({ limit: itemsPerPage * 5 });
    }
  };

  // Atualiza lista
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Aplica filtros
  const handleApplyFilters = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    const filterParams = {
      ...newFilters,
      limit: itemsPerPage * 5
    };

    // Remove filtros vazios
    Object.keys(filterParams).forEach(key => {
      if (!filterParams[key]) delete filterParams[key];
    });

    await fetchTransactions(filterParams);
  };

  // Limpa filtros
  const handleClearFilters = async () => {
    const clearedFilters = {
      type: '',
      start_date: '',
      end_date: '',
      card_id: cardId || '',
      barraca_id: barracaId || ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    await loadTransactions();
  };

  // Filtra transações localmente (para paginação)
  const filteredTransactions = transactions.filter(transaction => {
    if (filters.type && transaction.type !== filters.type) return false;
    if (filters.start_date && new Date(transaction.created_at) < new Date(filters.start_date)) return false;
    if (filters.end_date && new Date(transaction.created_at) > new Date(filters.end_date)) return false;
    return true;
  });

  // Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Estatísticas
  const stats = getTransactionStats(filteredTransactions);

  // Verifica se há filtros ativos
  const hasActiveFilters = filters.type || filters.start_date || filters.end_date;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transações</h2>
          <p className="text-muted-foreground">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação encontrada' : 'transações encontradas'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Resumo de estatísticas */}
      {showSummary && filteredTransactions.length > 0 && (
        <TransactionSummary stats={stats} />
      )}

      {/* Filtros */}
      {showFilters && (
        <TransactionFilter
          filters={filters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          disabled={loading}
        />
      )}

      {/* Badge de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Filtros ativos</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Erro */}
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

      {/* Lista vazia */}
      {!loading && filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowUpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
            <p className="text-muted-foreground text-center">
              {hasActiveFilters
                ? 'Tente ajustar os filtros de busca'
                : 'Ainda não há transações registradas'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de transações */}
      {!loading && paginatedTransactions.length > 0 && (
        <div className="space-y-3">
          {paginatedTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

