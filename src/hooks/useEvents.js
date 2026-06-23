import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      
      await loadEvents(); // Recarregar lista
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      return { data: null, error: err.message };
    }
  }

  async function updateEvent(eventId, updates) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      
      await loadEvents(); // Recarregar lista
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      return { data: null, error: err.message };
    }
  }

  async function deleteEvent(eventId) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      await loadEvents(); // Recarregar lista
      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar evento:', err);
      return { error: err.message };
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: loadEvents
  };
}

// Made with Bob
