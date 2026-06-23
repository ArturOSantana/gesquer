import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '../../contexts/OrganizationContext'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'

export default function OrganizationManagement() {
  const navigate = useNavigate()
  const { 
    organizations, 
    loading, 
    error,
    deleteOrganization,
    toggleOrganizationStatus,
    isSuperAdmin 
  } = useOrganization()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Redirecionar se não for superadmin
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas SuperAdmin pode gerenciar organizações.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!selectedOrg) return

    setActionLoading(true)
    const { error: deleteError } = await deleteOrganization(selectedOrg.id)
    setActionLoading(false)

    if (deleteError) {
      alert(`Erro ao deletar organização: ${deleteError}`)
    } else {
      setDeleteDialogOpen(false)
      setSelectedOrg(null)
    }
  }

  const handleToggleStatus = async (org) => {
    setActionLoading(true)
    const { error: toggleError } = await toggleOrganizationStatus(org.id, !org.is_active)
    setActionLoading(false)

    if (toggleError) {
      alert(`Erro ao alterar status: ${toggleError}`)
    }
  }

  const getTypeLabel = (type) => {
    const types = {
      paroquia: 'Paróquia',
      escola: 'Escola',
      associacao: 'Associação',
      empresa: 'Empresa',
      outro: 'Outro'
    }
    return types[type] || type
  }

  const getTypeBadgeVariant = (type) => {
    const variants = {
      paroquia: 'default',
      escola: 'secondary',
      associacao: 'outline',
      empresa: 'destructive',
      outro: 'outline'
    }
    return variants[type] || 'outline'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando organizações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gerenciar Organizações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as organizações do sistema
          </p>
        </div>
        <Button onClick={() => navigate('/admin/organizations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">organizações cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">em operação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => !o.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">desativadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id} className={!org.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {org.name}
                    {!org.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inativa
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="mt-1">
                    <Badge variant={getTypeBadgeVariant(org.type)}>
                      {getTypeLabel(org.type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Slug: {org.slug}</span>
                </div>
                {org.contact_email && (
                  <div className="text-muted-foreground">
                    📧 {org.contact_email}
                  </div>
                )}
                {org.contact_phone && (
                  <div className="text-muted-foreground">
                    📱 {org.contact_phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/admin/organizations/${org.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant={org.is_active ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleToggleStatus(org)}
                  disabled={actionLoading}
                >
                  {org.is_active ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedOrg(org)
                    setDeleteDialogOpen(true)
                  }}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {organizations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma organização cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando sua primeira organização
            </p>
            <Button onClick={() => navigate('/admin/organizations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a organização <strong>{selectedOrg?.name}</strong>?
              <br /><br />
              <span className="text-destructive font-semibold">
                ⚠️ ATENÇÃO: Esta ação irá deletar TODOS os eventos, usuários, cartões e dados
                relacionados a esta organização. Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Made with Bob
