import { useState } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Tabela de organizações com informações detalhadas
 * @param {Object} props
 * @param {Array} props.organizations - Lista de organizações
 * @param {Function} props.onView - Callback ao visualizar organização
 * @param {Function} props.onEdit - Callback ao editar organização
 * @param {Function} props.onDelete - Callback ao deletar organização
 * @param {Function} props.onImpersonate - Callback ao impersonar organização
 * @param {boolean} props.loading - Estado de carregamento
 */
export default function OrganizationsTable({ 
  organizations = [], 
  onView,
  onEdit,
  onDelete,
  onImpersonate,
  loading = false 
}) {
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Formatar moeda
  const formatCurrency = (cents) => {
    if (!cents) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  // Badge de status de assinatura
  const getSubscriptionBadge = (status) => {
    const variants = {
      active: { variant: 'default', label: 'Ativa' },
      trial: { variant: 'secondary', label: 'Trial' },
      expired: { variant: 'destructive', label: 'Expirada' },
      canceled: { variant: 'outline', label: 'Cancelada' },
      inactive: { variant: 'outline', label: 'Inativa' }
    }
    
    const config = variants[status] || variants.inactive
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Badge de status de pagamento
  const getPaymentStatusBadge = (status) => {
    const variants = {
      active: { variant: 'default', label: 'Em dia', className: 'bg-green-500' },
      trial: { variant: 'secondary', label: 'Trial' },
      expired: { variant: 'destructive', label: 'Vencida' },
      canceled: { variant: 'outline', label: 'Cancelada' }
    }
    
    const config = variants[status] || variants.expired
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // Ordenar organizações
  const sortedOrganizations = [...organizations].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Toggle ordenação
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Nenhuma organização encontrada
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Não há organizações cadastradas no sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('name')}
            >
              Organização
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plano
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('total_events')}
            >
              Eventos
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('total_users')}
            >
              Usuários
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('total_recharges_cents')}
            >
              Receita
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSort('created_at')}
            >
              Criada
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedOrganizations.map((org) => (
            <tr key={org.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {org.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {org.type === 'escola' ? 'Escola' : 
                       org.type === 'igreja' ? 'Igreja' : 
                       org.type === 'ong' ? 'ONG' : 'Outro'}
                    </div>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{org.plan_name || 'Sem plano'}</div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(org.plan_price)}/mês
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  {getSubscriptionBadge(org.subscription_status)}
                  {getPaymentStatusBadge(org.payment_status)}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {org.active_events}/{org.total_events}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Users className="h-4 w-4 mr-1 text-gray-400" />
                  {org.total_users}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                  {formatCurrency(org.total_recharges_cents)}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {org.created_at && formatDistanceToNow(new Date(org.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(org)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(org)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onImpersonate && (
                      <DropdownMenuItem onClick={() => onImpersonate(org)}>
                        <Users className="mr-2 h-4 w-4" />
                        Impersonar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(org)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Made with Bob
