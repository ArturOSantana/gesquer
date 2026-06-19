import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { validatePhone, validateEmail, validateCPF } from '@/lib/validators';

/**
 * Componente de formulário para criar/editar cartão
 * 
 * @param {Object} props
 * @param {Object} props.card - Dados do cartão para edição (opcional)
 * @param {Function} props.onSuccess - Callback após sucesso
 * @param {Function} props.onCancel - Callback ao cancelar
 * @param {string} props.mode - 'create' ou 'edit' (padrão: 'create')
 */
export default function CardForm({ 
  card = null,
  onSuccess,
  onCancel,
  mode = 'create'
}) {
  const { createCard, updateCard, loading } = useCards();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    initialBalance: '0'
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Preenche formulário no modo edição
  useEffect(() => {
    if (mode === 'edit' && card?.client) {
      setFormData({
        name: card.client.name || '',
        phone: card.client.phone || '',
        email: card.client.email || '',
        cpf: card.client.cpf || '',
        initialBalance: '0'
      });
    }
  }, [card, mode]);

  // Valida campo individual
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) {
          return 'Nome é obrigatório';
        }
        if (value.trim().length < 3) {
          return 'Nome deve ter pelo menos 3 caracteres';
        }
        return null;

      case 'phone':
        if (value && !validatePhone(value)) {
          return 'Telefone inválido. Use formato: (11) 98765-4321';
        }
        return null;

      case 'email':
        if (value && !validateEmail(value)) {
          return 'Email inválido';
        }
        return null;

      case 'cpf':
        if (value && !validateCPF(value)) {
          return 'CPF inválido';
        }
        return null;

      case 'initialBalance':
        const amount = parseFloat(value);
        if (isNaN(amount) || amount < 0) {
          return 'Valor inválido';
        }
        if (amount > 10000) {
          return 'Valor máximo é R$ 10.000,00';
        }
        return null;

      default:
        return null;
    }
  };

  // Atualiza campo do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Valida campo
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setSubmitError(null);
  };

  // Formata CPF enquanto digita
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      
      setFormData(prev => ({
        ...prev,
        cpf: value
      }));

      const error = validateField('cpf', value);
      setErrors(prev => ({
        ...prev,
        cpf: error
      }));
    }
  };

  // Formata telefone enquanto digita
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      
      setFormData(prev => ({
        ...prev,
        phone: value
      }));

      const error = validateField('phone', value);
      setErrors(prev => ({
        ...prev,
        phone: error
      }));
    }
  };

  // Valida formulário completo
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submete formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      setSubmitError('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      if (mode === 'create') {
        // Criar novo cartão
        const { data, error } = await createCard({
          name: formData.name.trim(),
          phone: formData.phone || null,
          email: formData.email || null,
          cpf: formData.cpf || null,
          initialBalance: parseFloat(formData.initialBalance) || 0
        });

        if (error) {
          setSubmitError(error);
          return;
        }

        setSubmitSuccess(true);
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        // Atualizar cartão existente
        const { data, error } = await updateCard(card.id, {
          client: {
            name: formData.name.trim(),
            phone: formData.phone || null,
            email: formData.email || null,
            cpf: formData.cpf || null,
          }
        });

        if (error) {
          setSubmitError(error);
          return;
        }

        setSubmitSuccess(true);
        
        if (onSuccess) {
          onSuccess(data);
        }
      }
    } catch (err) {
      console.error('Erro ao submeter formulário:', err);
      setSubmitError(err.message || 'Erro ao processar formulário');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Novo Cartão' : 'Editar Cartão'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Preencha os dados do cliente para criar um novo cartão'
            : 'Atualize as informações do cliente'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="João da Silva"
                value={formData.name}
                onChange={handleChange}
                className={`pl-9 ${errors.name ? 'border-destructive' : ''}`}
                disabled={loading}
                required
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={`pl-9 ${errors.phone ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="123.456.789-00"
                value={formData.cpf}
                onChange={handleCpfChange}
                className={`pl-9 ${errors.cpf ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf}</p>
            )}
          </div>

          {/* Saldo Inicial (apenas no modo criar) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Saldo Inicial</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="initialBalance"
                  name="initialBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={handleChange}
                  className={`pl-9 ${errors.initialBalance ? 'border-destructive' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.initialBalance && (
                <p className="text-sm text-destructive">{errors.initialBalance}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Valor inicial que será creditado no cartão
              </p>
            </div>
          )}

          {/* Mensagens de erro/sucesso */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {mode === 'create' 
                  ? 'Cartão criado com sucesso!'
                  : 'Cartão atualizado com sucesso!'}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading 
                ? 'Processando...' 
                : mode === 'create' 
                  ? 'Criar Cartão' 
                  : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Made with Bob
