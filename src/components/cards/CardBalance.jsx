import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DollarSign, Plus, Eye, EyeOff, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCards } from '@/hooks/useCards';

/**
 * Componente para exibir e gerenciar saldo do cartão
 * 
 * @param {Object} props
 * @param {Object} props.card - Dados do cartão
 * @param {boolean} props.showRecharge - Mostrar botão de recarga (padrão: true)
 * @param {Function} props.onRechargeSuccess - Callback após recarga bem-sucedida
 */
export default function CardBalance({ 
  card, 
  showRecharge = true,
  onRechargeSuccess 
}) {
  const { rechargeCard, loading } = useCards();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  if (!card) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum cartão selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const handleRecharge = async () => {
    setError(null);

    const amount = parseFloat(rechargeAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Digite um valor válido maior que zero');
      return;
    }

    if (amount > 10000) {
      setError('Valor máximo de recarga é R$ 10.000,00');
      return;
    }

    const { data, error: rechargeError } = await rechargeCard(card.id, amount);

    if (rechargeError) {
      setError(rechargeError);
      return;
    }

    // Sucesso
    setRechargeAmount('');
    setRechargeDialogOpen(false);
    
    if (onRechargeSuccess) {
      onRechargeSuccess(data);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Permite apenas números e ponto decimal
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setRechargeAmount(value);
      setError(null);
    }
  };

  const quickRechargeValues = [10, 20, 50, 100, 200];

  return (
    <div className="space-y-4">
      {/* Card de Saldo Principal */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Saldo Disponível
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBalanceVisibility}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            >
              {balanceVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-4xl font-bold">
              {balanceVisible ? formatCurrency(card.balance) : '••••••'}
            </div>
            
            {showRecharge && card.status === 'active' && (
              <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Recarregar Saldo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Recarregar Saldo</DialogTitle>
                    <DialogDescription>
                      Adicione créditos ao cartão do cliente
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {/* Input de valor */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor da Recarga</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="text"
                          placeholder="0.00"
                          value={rechargeAmount}
                          onChange={handleAmountChange}
                          className="pl-9"
                          disabled={loading}
                        />
                      </div>
                      {rechargeAmount && (
                        <p className="text-sm text-muted-foreground">
                          Novo saldo: {formatCurrency(parseFloat(card.balance) + parseFloat(rechargeAmount || 0))}
                        </p>
                      )}
                    </div>

                    {/* Valores rápidos */}
                    <div className="space-y-2">
                      <Label>Valores Rápidos</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {quickRechargeValues.map(value => (
                          <Button
                            key={value}
                            variant="outline"
                            size="sm"
                            onClick={() => setRechargeAmount(value.toString())}
                            disabled={loading}
                          >
                            R$ {value}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Erro */}
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRechargeDialogOpen(false);
                        setRechargeAmount('');
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleRecharge}
                      disabled={loading || !rechargeAmount}
                    >
                      {loading ? 'Processando...' : 'Confirmar Recarga'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.status === 'active' ? '✓ Ativo' : 
               card.status === 'inactive' ? '✗ Inativo' : 
               card.status === 'blocked' ? '🔒 Bloqueado' : card.status}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Tipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Pré-pago
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Made with Bob
