import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Store, AlertCircle } from 'lucide-react';

/**
 * Componente de formulário para criar/editar pontos de venda (PDVs)
 */
export function BarracaForm({ barraca, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    responsible: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  // Preenche formulário ao editar
  useEffect(() => {
    if (barraca) {
      setFormData({
        name: barraca.name || '',
        description: barraca.description || '',
        responsible: barraca.responsible || '',
        status: barraca.status || 'active'
      });
    }
  }, [barraca]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpa erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>
              {barraca ? 'Editar Ponto de Venda' : 'Novo Ponto de Venda'}
            </CardTitle>
            <CardDescription>
              {barraca
                ? 'Atualize as informações do ponto de venda'
                : 'Preencha os dados para criar um novo ponto de venda'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do Ponto de Venda <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              
              disabled={loading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              name="responsible"
              value={formData.responsible}
              onChange={handleChange}
              
              disabled={loading}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor, corrija os erros antes de continuar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              barraca ? 'Atualizar' : 'Criar Ponto de Venda'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

