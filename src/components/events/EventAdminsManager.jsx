import { useState } from 'react'
import { useEventAdmins } from '../../hooks/useEventAdmins'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Trash2, UserPlus } from 'lucide-react'

const ADMIN_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coordenador_geral', label: 'Coordenador Geral' },
  { value: 'coordenador_financeiro', label: 'Coordenador Financeiro' },
  { value: 'coordenador_estoque', label: 'Coordenador de Estoque' }
]

export function EventAdminsManager({ eventId, availableUsers }) {
  const { admins, loading, addAdmin, removeAdmin, updateAdminRole } = useEventAdmins(eventId)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('admin')

  const handleAddAdmin = async () => {
    if (!selectedUserId) return
    
    const success = await addAdmin(selectedUserId, selectedRole)
    if (success) {
      setSelectedUserId('')
      setSelectedRole('admin')
    }
  }

  const getRoleLabel = (role) => {
    return ADMIN_ROLES.find(r => r.value === role)?.label || role
  }

  // Filtrar usuários que já são admins
  const availableToAdd = availableUsers?.filter(
    user => !admins.some(admin => admin.user.id === user.id)
  ) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administradores do Evento</CardTitle>
        <CardDescription>
          Gerencie quem pode administrar este evento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo admin */}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleAddAdmin}
            disabled={!selectedUserId || loading}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Lista de admins */}
        <div className="space-y-2">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum administrador vinculado
            </p>
          ) : (
            admins.map(admin => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{admin.user.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={admin.role}
                    onValueChange={(newRole) => updateAdminRole(admin.id, newRole)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAdmin(admin.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Made with Bob
