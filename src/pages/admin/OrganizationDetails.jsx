import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrganization } from '../../contexts/OrganizationContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar,
  Layers,
  AlertCircle,
  Edit,
  Save,
  X,
  UserPlus,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { ROLES, getRoleLabel, getRoleBadgeColor } from '../../lib/permissions'

export default function OrganizationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { getOrganizationById, updateOrganization, isSuperAdmin } = useOrganization()

  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  
  // Estados para as abas
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [batches, setBatches] = useState([])
  const [loadingTab, setLoadingTab] = useState(false)

  // Estados para diálogos
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.ADMIN
  })
  const [newEventData, setNewEventData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    if (id) {
      loadOrganization()
    }
  }, [id])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      const { data, error } = await getOrganizationById(id)
      
      if (error) throw new Error(error)
      
      setOrganization(data)
      setEditData(data)
      
      // Carregar dados iniciais
      await Promise.all([
        loadUsers(),
        loadEvents(),
        loadBatches()
      ])
    } catch (err) {
      console.error('Erro ao carregar organização:', err)
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoadingTab(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoadingTab(false)
    }
  }

  const loadEvents = async () => {
    try {
      setLoadingTab(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoadingTab(false)
    }
  }

  const loadBatches = async () => {
    try {
      setLoadingTab(true)
      
      // Buscar lotes da organização através dos eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', id)

      if (eventsError) throw eventsError

      const eventIds = (eventsData || []).map(e => e.id)

      if (eventIds.length === 0) {
        setBatches([])
        return
      }

      // Buscar lotes dos eventos
      const { data, error } = await supabase
        .from('card_batches')
        .select(`
          *,
          cards:cards(count)
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (err) {
      console.error('Erro ao carregar lotes:', err)
      setBatches([])
    } finally {
      setLoadingTab(false)
    }
  }

  const handleSaveOrganization = async () => {
    try {
      const { error } = await updateOrganization(id, editData)
      
      if (error) throw new Error(error)
      
      setOrganization(editData)
      setEditing(false)
      
      toast({
        title: 'Sucesso',
        description: 'Organização atualizada com sucesso'
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleCreateUser = async () => {
    try {
      if (!newUserData.name || !newUserData.email || !newUserData.password) {
        throw new Error('Preencha todos os campos')
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        email_confirm: true,
        user_metadata: {
          name: newUserData.name,
          role: newUserData.role
        }
      })

      if (authError) throw authError

      // Inserir na tabela users
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          organization_id: id,
          active: true
        })

      if (dbError) throw dbError

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso'
      })

      setUserDialogOpen(false)
      setNewUserData({ name: '', email: '', password: '', role: ROLES.ADMIN })
      loadUsers()
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleCreateEvent = async () => {
    try {
      if (!newEventData.name || !newEventData.start_date) {
        throw new Error('Preencha os campos obrigatórios')
      }

      const { error } = await supabase
        .from('events')
        .insert({
          ...newEventData,
          organization_id: id,
          status: 'active'
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso'
      })

      setEventDialogOpen(false)
      setNewEventData({ name: '', description: '', start_date: '', end_date: '' })
      loadEvents()
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso'
      })

      loadUsers()
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas SuperAdmin pode visualizar detalhes de organizações.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando organização...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Organização não encontrada</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {organization.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os aspectos desta organização
            </p>
          </div>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setEditing(false)
              setEditData(organization)
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveOrganization}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Informações da Organização */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editData.slug}
                    onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={editData.contact_email || ''}
                    onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editData.contact_phone || ''}
                    onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={editData.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="font-medium">{organization.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{organization.type}</p>
              </div>
              {organization.contact_email && (
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{organization.contact_email}</p>
                </div>
              )}
              {organization.contact_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{organization.contact_phone}</p>
                </div>
              )}
              {organization.address && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{organization.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={organization.is_active ? 'default' : 'destructive'}>
                  {organization.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="font-medium">
                  {new Date(organization.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({users.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Eventos ({events.length})
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Lotes ({batches.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuários da Organização</h3>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo usuário para esta organização
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil *</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLES.ADMIN}>Administrador</SelectItem>
                        <SelectItem value={ROLES.CAIXA}>Caixa</SelectItem>
                        <SelectItem value={ROLES.PDV}>Operador PDV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} className="w-full">
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{user.name}</h4>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {!user.active && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba de Eventos */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Eventos da Organização</h3>
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo evento para esta organização
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={newEventData.name}
                      onChange={(e) => setNewEventData({ ...newEventData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={newEventData.description}
                      onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Início *</Label>
                    <Input
                      type="date"
                      value={newEventData.start_date}
                      onChange={(e) => setNewEventData({ ...newEventData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Input
                      type="date"
                      value={newEventData.end_date}
                      onChange={(e) => setNewEventData({ ...newEventData, end_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full">
                    Criar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.name}</h4>
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.start_date).toLocaleDateString('pt-BR')}
                        {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {events.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum evento cadastrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba de Lotes */}
        <TabsContent value="batches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lotes de Cartões</h3>
            <Button onClick={() => navigate('/admin/gerar-lote')}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Lote
            </Button>
          </div>

          <div className="grid gap-4">
            {batches.map((batch) => (
              <Card key={batch.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{batch.batch_code}</h4>
                        <Badge>{batch.cards?.[0]?.count || batch.quantity} cartões</Badge>
                      </div>
                      {batch.description && (
                        <p className="text-sm text-muted-foreground">{batch.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em {new Date(batch.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/batches/${batch.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {batches.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum lote gerado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Made with Bob