import React from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EventManagement() {
  const { events, loading } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div>Carregando eventos...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Eventos</h1>
          {user && (
            <p className="mt-1 text-sm text-gray-600">
              Usuário autenticado: {user.email}
            </p>
          )}
        </div>

        <Button onClick={() => navigate('/admin/events/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold">{event.name}</h3>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  event.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : event.status === 'completed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {event.status}
              </span>
            </div>

            <p className="mb-4 text-gray-600">
              {event.description || 'Sem descrição cadastrada.'}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-500">
                <Calendar className="mr-2 h-4 w-4" />
                {event.start_date || 'Sem data inicial'} - {event.end_date || 'Sem data final'}
              </div>
              <div className="flex items-center text-gray-500">
                <Users className="mr-2 h-4 w-4" />
                {event.participant_count || 0} participantes
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/events/${event.id}`)}
              >
                Gerenciar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="mt-6 p-8 text-center">
          <h2 className="text-lg font-semibold">Nenhum evento encontrado</h2>
          <p className="mt-2 text-sm text-gray-600">
            Crie o primeiro evento para começar o gerenciamento.
          </p>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
