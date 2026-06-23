import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { EventAdminsManager } from '../../components/events/EventAdminsManager'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { ArrowLeft, Calendar, Users, Settings } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner'

export default function EventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [event, setEvent] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEventDetails()
    loadAvailableUsers()
  }, [eventId])

  const loadEventDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error) {
      console.error('Erro ao carregar evento:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do evento',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('role', ['admin', 'caixa'])
        .eq('active', true)
        .order('name')

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Evento não encontrado</p>
            <Button onClick={() => navigate('/admin/events')} className="mt-4">
              Voltar para Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/events')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Eventos
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-gray-600 mt-1">{event.description}</p>
          </div>
          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
            {event.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">
            <Calendar className="w-4 h-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Users className="w-4 h-4 mr-2" />
            Administradores
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Evento</CardTitle>
              <CardDescription>Informações gerais sobre o evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-lg">{event.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <p className="text-lg">{event.type || 'Não especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descrição</label>
                <p className="text-lg">{event.description || 'Sem descrição'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Início</label>
                  <p className="text-lg">{event.start_date || 'Não definida'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Término</label>
                  <p className="text-lg">{event.end_date || 'Não definida'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <EventAdminsManager
            eventId={eventId}
            availableUsers={availableUsers}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Evento</CardTitle>
              <CardDescription>Gerencie as configurações do evento</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurações adicionais serão implementadas aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Made with Bob
