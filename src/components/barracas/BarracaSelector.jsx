import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Componente seletor de barraca para uso em formulários
 */
export function BarracaSelector({ 
  value, 
  onChange, 
  barracas, 
  loading, 
  error,
  required = false,
  disabled = false,
  label = 'Barraca',
  placeholder = 'Selecione uma barraca',
  showOnlyActive = true
}) {
  const [filteredBarracas, setFilteredBarracas] = useState([]);

  useEffect(() => {
    if (barracas) {
      const filtered = showOnlyActive 
        ? barracas.filter(b => b.status === 'active')
        : barracas;
      setFilteredBarracas(filtered);
    }
  }, [barracas, showOnlyActive]);

  const handleChange = (e) => {
    const selectedId = e.target.value ? parseInt(e.target.value) : null;
    const selectedBarraca = filteredBarracas.find(b => b.id === selectedId);
    onChange(selectedBarraca);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar barracas: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="barraca-selector">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        
        <select
          id="barraca-selector"
          value={value?.id || ''}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {loading ? 'Carregando...' : placeholder}
          </option>
          
          {filteredBarracas.map(barraca => (
            <option key={barraca.id} value={barraca.id}>
              {barraca.name}
              {barraca.responsible && ` - ${barraca.responsible}`}
            </option>
          ))}
        </select>

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {filteredBarracas.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          {showOnlyActive 
            ? 'Nenhuma barraca ativa disponível'
            : 'Nenhuma barraca cadastrada'}
        </p>
      )}

      {value && (
        <div className="bg-muted/50 rounded-md p-3 text-sm">
          <p className="font-medium">{value.name}</p>
          {value.description && (
            <p className="text-muted-foreground mt-1">{value.description}</p>
          )}
          {value.responsible && (
            <p className="text-muted-foreground mt-1">
              Responsável: {value.responsible}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Made with Bob
