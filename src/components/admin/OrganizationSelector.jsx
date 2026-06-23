import { useState, useEffect } from 'react'
import { useOrganization } from '../../contexts/OrganizationContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Building2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'

/**
 * Componente de seleção de organização
 * Permite filtrar dados por organização específica
 * 
 * @param {Object} props
 * @param {string} props.value - ID da organização selecionada
 * @param {Function} props.onValueChange - Callback quando organização muda
 * @param {boolean} props.showLabel - Mostrar label (padrão: true)
 * @param {boolean} props.showAllOption - Mostrar opção "Todas" (padrão: true)
 * @param {boolean} props.required - Campo obrigatório (padrão: false)
 * @param {string} props.placeholder - Placeholder customizado
 * @param {boolean} props.disabled - Desabilitar seleção
 * @param {string} props.className - Classes CSS adicionais
 */
export function OrganizationSelector({
  value,
  onValueChange,
  showLabel = true,
  showAllOption = true,
  required = false,
  placeholder = 'Selecione uma organização',
  disabled = false,
  className = ''
}) {
  const { organizations, loading, error, isSuperAdmin } = useOrganization()
  const [filteredOrgs, setFilteredOrgs] = useState([])

  useEffect(() => {
    // Filtrar apenas organizações ativas
    const active = organizations.filter(org => org.is_active)
    setFilteredOrgs(active)
  }, [organizations])

  // Se não for SuperAdmin, não mostrar o seletor
  if (!isSuperAdmin) {
    return null
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar organizações: {error}
        </AlertDescription>
      </Alert>
    )
  }

  // Mostrar loading
  if (loading) {
    return (
      <div className={className}>
        {showLabel && (
          <Label className="mb-2 block">
            Organização {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Carregando organizações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {showLabel && (
        <Label className="mb-2 block">
          Organização {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || filteredOrgs.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {value === 'all' ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Todas as organizações
              </span>
            ) : value ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {filteredOrgs.find(org => org.id === value)?.name || 'Organização não encontrada'}
              </span>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Todas as organizações</span>
                <Badge variant="secondary" className="ml-auto">
                  {filteredOrgs.length}
                </Badge>
              </div>
            </SelectItem>
          )}
          
          {filteredOrgs.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma organização ativa encontrada
            </div>
          ) : (
            filteredOrgs.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{org.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {org.type}
                  </Badge>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Informação adicional */}
      {filteredOrgs.length > 0 && value && value !== 'all' && (
        <p className="text-xs text-muted-foreground mt-1">
          {filteredOrgs.find(org => org.id === value)?.slug}
        </p>
      )}
    </div>
  )
}

/**
 * Componente compacto de seleção de organização (sem label)
 */
export function OrganizationSelectorCompact(props) {
  return <OrganizationSelector {...props} showLabel={false} />
}

/**
 * Hook para usar o seletor de organização com estado
 */
export function useOrganizationSelector(initialValue = 'all') {
  const [selectedOrg, setSelectedOrg] = useState(initialValue)
  const { organizations } = useOrganization()

  const getSelectedOrganization = () => {
    if (selectedOrg === 'all') return null
    return organizations.find(org => org.id === selectedOrg)
  }

  const isAllSelected = selectedOrg === 'all'

  return {
    selectedOrg,
    setSelectedOrg,
    getSelectedOrganization,
    isAllSelected
  }
}

// Made with Bob