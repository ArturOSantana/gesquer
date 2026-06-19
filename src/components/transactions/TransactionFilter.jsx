import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, Search } from 'lucide-react';
import { useBarracas } from '@/hooks/useBarracas';

/**
 * Componente de filtros para transações
 * Permite filtrar por tipo, data, barraca e cartão
 */
export function TransactionFilter({ 
  filters, 
  onApplyFilters, 
  onClearFilters,
  disabled = false 
}) {
  const { barracas, fetchActiveBarracas } = useBarracas();
  
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Carrega barracas
  useEffect(() => {
    fetchActiveBarracas();
  }, [fetchActiveBarracas]);

  // Atualiza filtros locais quando props mudam
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Atualiza um filtro específico
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Aplica filtros
  const handleApply = () => {
    onApplyFilters(localFilters);
    setIsExpanded(false);
  };

  // Limpa filtros
  const handleClear = () => {
    const clearedFilters = {
      type: '',
      start_date: '',
      end_date: '',
      card_id: '',
      barraca_id: ''
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setIsExpanded(false);
  };

  // Verifica se há filtros ativos
  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  // Tipos de transação
  const transactionTypes = [
    { value: 'recharge', label: 'Recarga' },
    { value: 'purchase', label: 'Compra' },
    { value: 'refund', label: 'Estorno' },
    { value: 'transfer_in', label: 'Transferência Recebida' },
    { value: 'transfer_out', label: 'Transferência Enviada' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="text-xs font-normal text-muted-foreground">
                ({Object.values(localFilters).filter(v => v).length} ativos)
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Tipo de transação */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Transação</Label>
            <Select
              value={localFilters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
              disabled={disabled}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Barraca */}
          <div className="space-y-2">
            <Label htmlFor="barraca">Barraca</Label>
            <Select
              value={localFilters.barraca_id}
              onValueChange={(value) => handleFilterChange('barraca_id', value)}
              disabled={disabled}
            >
              <SelectTrigger id="barraca">
                <SelectValue placeholder="Todas as barracas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as barracas</SelectItem>
                {barracas.map((barraca) => (
                  <SelectItem key={barraca.id} value={barraca.id}>
                    {barraca.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ID do Cartão */}
          <div className="space-y-2">
            <Label htmlFor="card_id">ID do Cartão</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="card_id"
                type="text"
                placeholder="Digite o UUID do cartão"
                value={localFilters.card_id}
                onChange={(e) => handleFilterChange('card_id', e.target.value)}
                disabled={disabled}
                className="pl-10"
              />
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Inicial</Label>
              <Input
                id="start_date"
                type="date"
                value={localFilters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Final</Label>
              <Input
                id="end_date"
                type="date"
                value={localFilters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApply}
              disabled={disabled}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Made with Bob