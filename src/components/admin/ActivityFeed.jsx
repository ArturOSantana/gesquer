import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  LogIn, 
  Users,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'

/**
 * Feed de atividades recentes do sistema
 * @param {Object} props
 * @param {Array} props.activities - Lista de atividades
 * @param {number} props.maxHeight - Altura máxima do scroll
 * @param {boolean} props.loading - Estado de carregamento
 */
export default function ActivityFeed({ 
  activities = [], 
  maxHeight = 400,
  loading = false 
}) {
  // Ícone baseado no tipo de ação
  const getActionIcon = (action) => {
    const icons = {
      create: UserPlus,
      update: Edit,
      delete: Trash2,
      login: LogIn,
      impersonate: Users,
      export: FileText
    }
    return icons[action] || FileText
  }

  // Cor baseada no tipo de ação
  const getActionColor = (action) => {
    const colors = {
      create: 'text-green-600 bg-green-50',
      update: 'text-blue-600 bg-blue-50',
      delete: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
      impersonate: 'text-orange-600 bg-orange-50',
      export: 'text-gray-600 bg-gray-50'
    }
    return colors[action] || 'text-gray-600 bg-gray-50'
  }

  // Label da ação em português
  const getActionLabel = (action) => {
    const labels = {
      create: 'Criou',
      update: 'Atualizou',
      delete: 'Deletou',
      login: 'Login',
      impersonate: 'Impersonou',
      export: 'Exportou'
    }
    return labels[action] || action
  }

  // Label do tipo de recurso
  const getResourceLabel = (resourceType) => {
    const labels = {
      organization: 'Organização',
      event: 'Evento',
      subscription: 'Assinatura',
      user: 'Usuário',
      card: 'Cartão',
      transaction: 'Transação',
      plan: 'Plano'
    }
    return labels[resourceType] || resourceType
  }

  // Ícone do tipo de recurso
  const getResourceIcon = (resourceType) => {
    const icons = {
      organization: Building2,
      event: Calendar,
      subscription: CreditCard,
      user: Users,
      card: CreditCard,
      transaction: DollarSign,
      plan: FileText
    }
    return icons[resourceType] || FileText
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Nenhuma atividade recente
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          As atividades do sistema aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="pr-4" style={{ maxHeight: `${maxHeight}px` }}>
      <div className="space-y-4">
        {activities.map((activity) => {
          const ActionIcon = getActionIcon(activity.action)
          const ResourceIcon = getResourceIcon(activity.resource_type)
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Ícone da ação */}
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                <ActionIcon className="h-5 w-5" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user_name || 'Sistema'}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {activity.user_role === 'superadmin' ? 'SuperAdmin' :
                     activity.user_role === 'admin' ? 'Admin' :
                     activity.user_role === 'caixa' ? 'Caixa' : 'Usuário'}
                  </Badge>
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <span>{getActionLabel(activity.action)}</span>
                  <ResourceIcon className="h-3 w-3" />
                  <span className="font-medium">
                    {getResourceLabel(activity.resource_type)}
                  </span>
                </div>

                {activity.organization_name && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Building2 className="h-3 w-3" />
                    <span>{activity.organization_name}</span>
                  </div>
                )}

                {/* Detalhes da mudança */}
                {activity.new_values && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                    {activity.action === 'create' && (
                      <div>
                        <span className="font-medium">Criado:</span>{' '}
                        {activity.new_values.name || activity.new_values.title || 'Novo registro'}
                      </div>
                    )}
                    {activity.action === 'update' && activity.old_values && (
                      <div className="space-y-1">
                        {Object.keys(activity.new_values).map((key) => {
                          if (activity.old_values[key] !== activity.new_values[key]) {
                            return (
                              <div key={key}>
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="line-through text-red-600">
                                  {String(activity.old_values[key])}
                                </span>
                                {' → '}
                                <span className="text-green-600">
                                  {String(activity.new_values[key])}
                                </span>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  {activity.created_at && formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

// Made with Bob
