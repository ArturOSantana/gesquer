import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  CreditCard, 
  User, 
  Phone,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Componente para listar cartões com busca e filtros
 * 
 * @param {Object} props
 * @param {Array} props.cards - Lista de cartões
 * @param {boolean} props.loading - Estado de carregamento
 * @param {Function} props.onCardClick - Callback ao clicar em um cartão
 * @param {Function} props.onRefresh - Callback para atualizar lista
 * @param {Function} props.onCreateNew - Callback para criar novo cartão
 * @param {boolean} props.showCreateButton - Mostrar botão criar (padrão: true)
 */
export default function CardList({ 
  cards = [],
  loading = false,
  onCardClick,
  onRefresh,
  onCreateNew,
  showCreateButton = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtra e busca cartões
  const filteredCards = useMemo(() => {
    let filtered = [...cards];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(card => card.status === statusFilter);
    }

    // Busca por nome, telefone ou UUID
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(card => {
        const clientName = card.client?.name?.toLowerCase() || '';
        const clientPhone = card.client?.phone?.toLowerCase() || '';
        const cardUuid = card.uuid?.toLowerCase() || '';
        
        return (
          clientName.includes(search) ||
          clientPhone.includes(search) ||
          cardUuid.includes(search)
        );
      });
    }

    return filtered;
  }, [cards, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      blocked: 'destructive'
    };

    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      blocked: 'Bloqueado'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com busca e filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cartões Cadastrados</CardTitle>
              <CardDescription>
                {filteredCards.length} {filteredCards.length === 1 ? 'cartão encontrado' : 'cartões encontrados'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              {showCreateButton && onCreateNew && (
                <Button
                  size="sm"
                  onClick={onCreateNew}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cartão
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cartões */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum cartão encontrado com os filtros aplicados'
                  : 'Nenhum cartão cadastrado ainda'}
              </p>
              {showCreateButton && onCreateNew && !searchTerm && statusFilter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={onCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Cartão
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCards.map((card) => (
            <Card 
              key={card.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onCardClick && onCardClick(card)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Cliente */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {card.client?.name || 'Cliente não identificado'}
                      </span>
                    </div>

                    {/* Telefone */}
                    {card.client?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{card.client.phone}</span>
                      </div>
                    )}

                    {/* UUID */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span className="font-mono">{card.uuid}</span>
                    </div>

                    {/* Data de criação */}
                    <div className="text-xs text-muted-foreground">
                      Criado em {formatDate(card.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Status */}
                    {getStatusBadge(card.status)}

                    {/* Saldo */}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(card.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

