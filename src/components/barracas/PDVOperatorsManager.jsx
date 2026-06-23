import { useState } from 'react'
import { usePDVOperators } from '../../hooks/usePDVOperators'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Trash2, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react'

export function PDVOperatorsManager({ pdvId, pdvName, availableOperators }) {
  const { operators, loading, assignOperator, removeOperator, toggleOperatorStatus } = usePDVOperators(pdvId)
  const [selectedOperatorId, setSelectedOperatorId] = useState('')

  const handleAssignOperator = async () => {
    if (!selectedOperatorId) return
    
    const success = await assignOperator(selectedOperatorId)
    if (success) {
      setSelectedOperatorId('')
    }
  }

  // Filtrar operadores que já estão vinculados
  const availableToAdd = availableOperators?.filter(
    op => !operators.some(operator => operator.user.id === op.id)
  ) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operadores do PDV: {pdvName}</CardTitle>
        <CardDescription>
          Gerencie quem pode operar este ponto de venda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo operador */}
        <div className="flex gap-2">
          <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um operador" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map(operator => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.name} ({operator.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleAssignOperator}
            disabled={!selectedOperatorId || loading}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Vincular
          </Button>
        </div>

        {/* Lista de operadores */}
        <div className="space-y-2">
          {operators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum operador vinculado
            </p>
          ) : (
            operators.map(operator => (
              <div
                key={operator.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{operator.user.name}</p>
                  <p className="text-sm text-muted-foreground">{operator.user.email}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={operator.is_active ? 'default' : 'secondary'}>
                    {operator.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleOperatorStatus(operator.id, !operator.is_active)}
                    title={operator.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {operator.is_active ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOperator(operator.id)}
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
