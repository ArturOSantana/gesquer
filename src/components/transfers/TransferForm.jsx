import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRightLeft, 
  Loader2, 
  AlertCircle,
  CreditCard,
  DollarSign,
  User,
  Search
} from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { formatCurrency } from '@/lib/utils';

/**
 * Formulário de transferência entre cartões
 * Permite buscar cartões e definir valor da transferência
 */
export function TransferForm({ onSubmit, loading = false }) {
  const { getCardByUuid, getCardByPhone } = useCards();

  const [fromCard, setFromCard] = useState(null);
  const [toCard, setToCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);
  const [errors, setErrors] = useState({});

  // Busca cartão de origem
  const handleSearchFrom = async () => {
    if (!searchFrom.trim()) {
      setErrors(prev => ({ ...prev, searchFrom: 'Digite um UUID ou telefone' }));
      return;
    }

    try {
      setSearchingFrom(true);
      setErrors(prev => ({ ...prev, searchFrom: null }));

      // Tenta buscar por UUID primeiro
      let result = await getCardByUuid(searchFrom.trim());
      
      // Se não encontrar, tenta por telefone
      if (!result.data) {
        result = await getCardByPhone(searchFrom.trim());
      }

      if (result.error || !result.data) {
        setErrors(prev => ({ ...prev, searchFrom: 'Cartão não encontrado' }));
        setFromCard(null);
        return;
      }

      // Verifica se o cartão está ativo
      if (result.data.status !== 'active') {
        setErrors(prev => ({ ...prev, searchFrom: 'Cartão inativo' }));
        setFromCard(null);
        return;
      }

      setFromCard(result.data);
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      setErrors(prev => ({ ...prev, searchFrom: error.message }));
      setFromCard(null);
    } finally {
      setSearchingFrom(false);
    }
  };

  // Busca cartão de destino
  const handleSearchTo = async () => {
    if (!searchTo.trim()) {
      setErrors(prev => ({ ...prev, searchTo: 'Digite um UUID ou telefone' }));
      return;
    }

    try {
      setSearchingTo(true);
      setErrors(prev => ({ ...prev, searchTo: null }));

      // Tenta buscar por UUID primeiro
      let result = await getCardByUuid(searchTo.trim());
      
      // Se não encontrar, tenta por telefone
      if (!result.data) {
        result = await getCardByPhone(searchTo.trim());
      }

      if (result.error || !result.data) {
        setErrors(prev => ({ ...prev, searchTo: 'Cartão não encontrado' }));
        setToCard(null);
        return;
      }

      // Verifica se o cartão está ativo
      if (result.data.status !== 'active') {
        setErrors(prev => ({ ...prev, searchTo: 'Cartão inativo' }));
        setToCard(null);
        return;
      }

      // Verifica se não é o mesmo cartão
      if (fromCard && result.data.id === fromCard.id) {
        setErrors(prev => ({ ...prev, searchTo: 'Não é possível transferir para o mesmo cartão' }));
        setToCard(null);
        return;
      }

      setToCard(result.data);
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      setErrors(prev => ({ ...prev, searchTo: error.message }));
      setToCard(null);
    } finally {
      setSearchingTo(false);
    }
  };

  // Valida formulário
  const validateForm = () => {
    const newErrors = {};

    if (!fromCard) {
      newErrors.fromCard = 'Selecione o cartão de origem';
    }

    if (!toCard) {
      newErrors.toCard = 'Selecione o cartão de destino';
    }

    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    } else if (fromCard && amountValue > fromCard.balance) {
      newErrors.amount = `Saldo insuficiente. Disponível: ${formatCurrency(fromCard.balance)}`;
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submete transferência
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      fromCardId: fromCard.id,
      toCardId: toCard.id,
      amount: parseFloat(amount),
      description: description.trim(),
      fromCard,
      toCard
    });
  };

  // Limpa formulário
  const handleReset = () => {
    setFromCard(null);
    setToCard(null);
    setAmount('');
    setDescription('');
    setSearchFrom('');
    setSearchTo('');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cartão de Origem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartão de Origem
          </CardTitle>
          <CardDescription>
            Digite o UUID ou telefone do cartão que enviará o saldo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="UUID ou telefone"
                value={searchFrom}
                onChange={(e) => {
                  setSearchFrom(e.target.value);
                  setErrors(prev => ({ ...prev, searchFrom: null }));
                }}
                disabled={loading || searchingFrom}
              />
            </div>
            <Button
              type="button"
              onClick={handleSearchFrom}
              disabled={loading || searchingFrom || !searchFrom.trim()}
            >
              {searchingFrom ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {errors.searchFrom && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.searchFrom}</AlertDescription>
            </Alert>
          )}

          {fromCard && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{fromCard.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{fromCard.uuid}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(fromCard.balance)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cartão de Destino */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartão de Destino
          </CardTitle>
          <CardDescription>
            Digite o UUID ou telefone do cartão que receberá o saldo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="UUID ou telefone"
                value={searchTo}
                onChange={(e) => {
                  setSearchTo(e.target.value);
                  setErrors(prev => ({ ...prev, searchTo: null }));
                }}
                disabled={loading || searchingTo}
              />
            </div>
            <Button
              type="button"
              onClick={handleSearchTo}
              disabled={loading || searchingTo || !searchTo.trim()}
            >
              {searchingTo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {errors.searchTo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.searchTo}</AlertDescription>
            </Alert>
          )}

          {toCard && (
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{toCard.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{toCard.uuid}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(toCard.balance)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valor e Descrição */}
      {fromCard && toCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Detalhes da Transferência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Valor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={fromCard.balance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors(prev => ({ ...prev, amount: null }));
                }}
                disabled={loading}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Ex: Transferência de saldo"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors(prev => ({ ...prev, description: null }));
                }}
                disabled={loading}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Preview */}
            {amount && parseFloat(amount) > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Preview da Transferência:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Saldo Origem Atual:</p>
                    <p className="font-bold">{formatCurrency(fromCard.balance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Novo Saldo Origem:</p>
                    <p className="font-bold text-red-600">
                      {formatCurrency(fromCard.balance - parseFloat(amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo Destino Atual:</p>
                    <p className="font-bold">{formatCurrency(toCard.balance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Novo Saldo Destino:</p>
                    <p className="font-bold text-green-600">
                      {formatCurrency(toCard.balance + parseFloat(amount))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={loading}
          className="flex-1"
        >
          Limpar
        </Button>
        <Button
          type="submit"
          disabled={loading || !fromCard || !toCard}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar
        </Button>
      </div>
    </form>
  );
}

// Made with Bob