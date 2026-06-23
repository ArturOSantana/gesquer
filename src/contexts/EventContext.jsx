import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContext';

const EventContext = createContext();

export function EventProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false); // Mudado para false para não bloquear
  const [error, setError] = useState(null);

  // Carregar eventos disponíveis
  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      // Se não há usuário, limpa os estados
      setEvents([]);
      setCurrentEvent(null);
      setLoading(false);
    }
  }, [user]);

  // Carregar evento atual do localStorage
  useEffect(() => {
    const savedEventId = localStorage.getItem('venditor_current_event');
    if (savedEventId && events.length > 0) {
      const event = events.find(e => e.id === savedEventId);
      if (event) {
        setCurrentEvent(event);
      } else {
        // Se evento salvo não existe mais, usar o primeiro disponível
        setCurrentEvent(events[0]);
        localStorage.setItem('venditor_current_event', events[0].id);
      }
    } else if (events.length > 0 && !currentEvent) {
      // Se não tem evento salvo, usar o primeiro
      setCurrentEvent(events[0]);
      localStorage.setItem('venditor_current_event', events[0].id);
    }
  }, [events]);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existe, apenas loga o erro mas não quebra
        if (error.code === '42P01') {
          console.warn('Tabela events não existe ainda. Sistema funcionará sem eventos.');
          setEvents([]);
          setError('Tabela events não configurada');
          return;
        }
        throw error;
      }
      
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError(error.message);
      // Não quebra o sistema, apenas define eventos como vazio
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function switchEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setCurrentEvent(event);
      localStorage.setItem('venditor_current_event', eventId);
    }
  }

  const value = {
    currentEvent,
    events,
    loading,
    error,
    switchEvent,
    refreshEvents: loadEvents
  };

  // Sempre renderiza os children, mesmo se houver erro
  // O sistema deve funcionar sem eventos
  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent deve ser usado dentro de EventProvider');
  }
  return context;
}

// Made with Bob
