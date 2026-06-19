import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useBarracas } from '@/hooks/useBarracas';

/**
 * Formulário para criar e editar produtos
 * Suporta modo criação e edição
 */
export function ProductForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  product = null,
  loading = false 
}) {
  const { barracas, fetchActiveBarracas } = useBarracas();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    min_stock: '',
    barraca_id: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Carrega barracas ativas ao abrir o formulário
  useEffect(() => {
    if (open) {
      fetchActiveBarracas();
    }
  }, [open, fetchActiveBarracas]);

  // Preenche formulário ao editar
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        barraca_id: product.barraca_id || '',
        status: product.status || 'active'
      });
    } else {
      // Reseta formulário ao criar novo
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '0',
        min_stock: '0',
        barraca_id: '',
        status: 'active'
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [product, open]);

  // Valida formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.barraca_id) {
      newErrors.barraca_id = 'Barraca é obrigatória';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Preço deve ser maior ou igual a zero';
    }

    const stockQty = parseInt(formData.stock_quantity);
    if (isNaN(stockQty) || stockQty < 0) {
      newErrors.stock_quantity = 'Quantidade deve ser maior ou igual a zero';
    }

    const minStock = parseInt(formData.min_stock);
    if (isNaN(minStock) || minStock < 0) {
      newErrors.min_stock = 'Estoque mínimo deve ser maior ou igual a zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipula mudanças nos campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpa erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    setSubmitError(null);
  };

  // Submete formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError(null);
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock: parseInt(formData.min_stock),
        barraca_id: formData.barraca_id,
        status: formData.status
      };

      await onSubmit(productData);
      
      // Fecha dialog após sucesso
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setSubmitError(error.message || 'Erro ao salvar produto');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? 'Atualize as informações do produto abaixo.'
              : 'Preencha os dados do novo produto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Erro geral */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do Produto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              
              disabled={loading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              
              disabled={loading}
            />
          </div>

          {/* Barraca */}
          <div className="space-y-2">
            <Label htmlFor="barraca">
              Barraca <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.barraca_id}
              onValueChange={(value) => handleChange('barraca_id', value)}
              disabled={loading || (product && product.barraca_id)}
            >
              <SelectTrigger className={errors.barraca_id ? 'border-destructive' : ''}>
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                {barracas.map((barraca) => (
                  <SelectItem key={barraca.id} value={barraca.id}>
                    {barraca.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.barraca_id && (
              <p className="text-sm text-destructive">{errors.barraca_id}</p>
            )}
            {product && product.barraca_id && (
              <p className="text-xs text-muted-foreground">
                A barraca não pode ser alterada após a criação
              </p>
            )}
          </div>

          {/* Preço e Estoque */}
          <div className="grid grid-cols-2 gap-4">
            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Preço (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                
                disabled={loading}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Quantidade em Estoque */}
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">
                Quantidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', e.target.value)}
                
                disabled={loading}
                className={errors.stock_quantity ? 'border-destructive' : ''}
              />
              {errors.stock_quantity && (
                <p className="text-sm text-destructive">{errors.stock_quantity}</p>
              )}
            </div>
          </div>

          {/* Estoque Mínimo e Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Estoque Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="min_stock">
                Estoque Mínimo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => handleChange('min_stock', e.target.value)}
                
                disabled={loading}
                className={errors.min_stock ? 'border-destructive' : ''}
              />
              {errors.min_stock && (
                <p className="text-sm text-destructive">{errors.min_stock}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Alerta quando estoque atingir este valor
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

