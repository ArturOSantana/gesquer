import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useBatch } from '../../hooks/useBatch';
import { useAuth } from '../../hooks/useAuth';
import { useEvent } from '../../contexts/EventContext';
import { useSubscription } from '../../hooks/useSubscription';
import { LimitWarning } from '../subscription/LimitWarning';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function BatchGenerator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentEvent } = useEvent();
  const [quantity, setQuantity] = useState(10);
  const [description, setDescription] = useState('');
  const [currentCards, setCurrentCards] = useState(0);
  const [canCreate, setCanCreate] = useState(true);

  const { loading, error, generateBatch } = useBatch();
  const {
    canCreateCard,
    limits,
    loading: subscriptionLoading
  } = useSubscription();

  // Carregar quantidade atual de cartões do evento
  useEffect(() => {
    const loadCurrentCards = async () => {
      if (!currentEvent?.id) return;

      const { count, error } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', currentEvent.id);

      if (!error) {
        setCurrentCards(count || 0);
      }
    };

    loadCurrentCards();
  }, [currentEvent]);

  // Verificar se pode criar cartões
  useEffect(() => {
    const checkLimit = async () => {
      if (!currentEvent?.id || subscriptionLoading) return;

      const allowed = await canCreateCard(currentEvent.id);
      setCanCreate(allowed);
    };

    checkLimit();
  }, [currentEvent, canCreateCard, subscriptionLoading]);

  const handleGenerate = async () => {
    if (!currentEvent) {
      alert('Selecione um evento primeiro');
      return;
    }

    if (quantity < 1 || quantity > 1000) {
      alert('Quantidade deve estar entre 1 e 1000');
      return;
    }

    // Verificar se a quantidade não excede o limite
    if (limits?.max_cards_per_event) {
      const totalAfter = currentCards + quantity;
      if (totalAfter > limits.max_cards_per_event) {
        alert(`Esta quantidade excederia o limite de ${limits.max_cards_per_event} cartões por evento. Você tem ${currentCards} cartões e pode criar mais ${limits.max_cards_per_event - currentCards}.`);
        return;
      }
    }

    const generatedBy = profile?.id || profile?.name || 'Admin';
    const result = await generateBatch(quantity, description, generatedBy);

    if (result.success) {
      navigate(`/admin/batches/${result.batch.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aviso de limite de cartões */}
      {limits?.max_cards_per_event && currentEvent && (
        <LimitWarning
          current={currentCards}
          max={limits.max_cards_per_event}
          type="cartões"
        />
      )}

      {/* Aviso se não pode criar */}
      {!subscriptionLoading && !canCreate && currentEvent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você atingiu o limite de {limits?.max_cards_per_event} cartões para este evento.
            Faça upgrade do seu plano para criar mais cartões.
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso se não tem evento selecionado */}
      {!currentEvent && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione um evento antes de gerar cartões.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade de Cartões</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            
          />
          <p className="text-sm text-gray-500">
            Mínimo: 1 | Máximo: 1000
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Opcional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGenerate}
        disabled={loading || quantity < 1 || !canCreate || !currentEvent || subscriptionLoading}
        className="w-full"
      >
        {loading ? 'Gerando...' : `Gerar ${quantity} Cartões`}
      </Button>
    </div>
  );
}

