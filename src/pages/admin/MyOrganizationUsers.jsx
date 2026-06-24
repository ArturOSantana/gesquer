import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/use-toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  Users, 
  UserPlus,
  Trash2,
  Key,
  AlertCircle
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

export default function MyOrganizationUsers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [organization, setOrganization] = useState(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.CAIXA
  })

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Buscar organização do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      if (!userData.organization_id) {
        throw new Error('Usuário não está vinculado a nenhuma organização')
      }

      // Buscar dados da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      if (orgError) throw orgError

      setOrganization(orgData)

      // Buscar usuários da organização
      await loadUsers(userData.organization_id)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async (orgId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    }
  }

  const handleCreateUser = async () => {
    try {
      if (!newUserData.name || !newUserData.email || !newUserData.password) {
        throw new Error('Preencha todos os campos')
      }

      // Chamar Edge Function para criar usuário (sem rate limit)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newUserData.name,
            email: newUserData.email,
            password: newUserData.password,
            role: newUserData.role,
            organization_id: organization.id
          })
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso'
      })

      setUserDialogOpen(false)
      setNewUserData({ name: '', email: '', password: '', role: ROLES.CAIXA })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      loadUsers(organization.id)
    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar usuário',
        variant: 'destructive'
      })
    }
  }

  const handleResetPassword = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres')
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            newPassword: newPassword
          })
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar senha')
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso'
      })

      setPasswordDialogOpen(false)
      setSelectedUser(null)
      setNewPassword('')
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

      loadUsers(organization.id)
    } catch (err) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Organização não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">{organization.name}</p>
      </div>

      {/* Card de Usuários */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários da Organização
              </CardTitle>
              <CardDescription>
                Gerencie os usuários que têm acesso ao sistema
              </CardDescription>
            </div>
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
                        <SelectItem value={ROLES.CAIXA}>Caixa</SelectItem>
                        <SelectItem value={ROLES.PDV}>Operador PDV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mostrar limites */}
                  {organization && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="text-sm space-y-1">
                          <p><strong>Limites da Organização:</strong></p>
                          <p>• Caixas: {users.filter(u => u.role === ROLES.CAIXA).length} / {organization.max_users_caixa || 5}</p>
                          <p>• Operadores PDV: {users.filter(u => u.role === ROLES.PDV).length} / {organization.max_users_pdv || 10}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleCreateUser} className="w-full">
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{u.name}</h4>
                        <Badge className={getRoleBadgeColor(u.role)}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u)
                          setPasswordDialogOpen(true)
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
        </CardContent>
      </Card>

      {/* Dialog para Redefinir Senha */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Alterar senha do usuário: {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleResetPassword} 
                className="flex-1"
                disabled={!newPassword || newPassword.length < 6}
              >
                Alterar Senha
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setSelectedUser(null)
                  setNewPassword('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Made with Bob
