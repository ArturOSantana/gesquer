import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LimitWarning } from '@/components/subscription/LimitWarning';
import { EVENT_TYPES } from '@/lib/eventTypes';
import { AlertCircle } from 'lucide-react';

export default function NewEvent() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  
  const {
    canCreateEvent,
    limits,
    loading: subscriptionLoading,
    isActive
  } = useSubscription();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'quermesse',
    start_date: '',
    end_date: '',
    allow_credit_persistence: false,
    max_card_balance: 1000
  });

  // Verificar se pode criar evento ao carregar
  useEffect(() => {
    const checkLimit = async () => {
      if (!subscriptionLoading) {
        const allowed = await canCreateEvent();
        setCanCreate(allowed);
      }
    };
    checkLimit();
  }, [canCreateEvent, subscriptionLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar assinatura ativa
    if (!isActive()) {
      toast({
        title: 'Assinatura inativa',
        description: 'Você precisa de uma assinatura ativa para criar eventos.',
        variant: 'destructive',
      });
      navigate('/organization/upgrade');
      return;
    }

    // Verificar limite
    if (!canCreate) {
      toast({
        title: 'Limite atingido',
        description: 'Você atingiu o limite de eventos do seu plano. Faça upgrade para continuar.',
        variant: 'destructive',
      });
      navigate('/organization/upgrade');
      return;
    }

    setLoading(true);

    try {
      const result = await createEvent(formData);

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Evento criado!',
        description: 'O evento foi criado com sucesso.',
      });
      navigate('/admin/events');
    } catch (error) {
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Novo Evento</h1>

      {/* Aviso de limite */}
      {limits && limits.max_events && (
        <LimitWarning
          current={limits.current_events || 0}
          max={limits.max_events}
          type="eventos"
        />
      )}

      {/* Aviso se não pode criar */}
      {!subscriptionLoading && !canCreate && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Limite de eventos atingido</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você atingiu o limite de {limits?.max_events} eventos do seu plano.
              Faça upgrade para criar mais eventos.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => navigate('/organization/upgrade')}
            >
              Fazer Upgrade
            </Button>
          </div>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Evento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Evento</Label>
            <select
              id="type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {EVENT_TYPES.map((eventType) => (
                <option key={eventType.value} value={eventType.value}>
                  {eventType.icon} {eventType.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione o tipo de evento para personalizar a experiência
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_credit_persistence"
              checked={formData.allow_credit_persistence}
              onChange={(e) => setFormData({ ...formData, allow_credit_persistence: e.target.checked })}
            />
            <Label htmlFor="allow_credit_persistence">
              Permitir créditos persistentes entre eventos
            </Label>
          </div>

          <div>
            <Label htmlFor="max_card_balance">Saldo máximo por cartão</Label>
            <Input
              id="max_card_balance"
              type="number"
              min="0"
              value={formData.max_card_balance}
              onChange={(e) => setFormData({ ...formData, max_card_balance: Number(e.target.value) })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !canCreate || subscriptionLoading}
            >
              {loading ? 'Criando...' : 'Criar Evento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/events')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Made with Bob
