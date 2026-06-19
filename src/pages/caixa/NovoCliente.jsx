import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import QrScanner from '@/components/qr/QrScanner';
import { useCardBinding } from '@/hooks/useCardBinding';
import { 
  User, 
  Phone, 
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Scan
} from 'lucide-react';

/**
 * Página do Caixa: Ativar Cartão Pré-impresso
 *
 * IMPORTANTE: Para ATIVAR um cartão, ele DEVE ser vinculado a um cliente.
 * Cartões sem cliente ficam em status 'pending' (não ativados).
 *
 * Fluxo de Ativação:
 * 1. Escanear QR Code do cartão pré-impresso (status: pending)
 * 2. Verificar se cartão está disponível para vinculação
 * 3. Cadastrar dados do cliente (nome obrigatório + telefone opcional)
 * 4. Vincular cartão ao cliente → Cartão muda para status 'active'
 * 5. Entregar cartão físico ativado ao cliente
 *
 * REGRAS:
 * - Cartão só é ATIVADO quando vinculado a um cliente
 * - Cartão ativado pode fazer recargas e compras
 * - Para DESATIVAR: use a função de bloqueio de cartão
 * - Para EXCLUIR: delete o registro do cartão no banco de dados
 */
export default function NovoCliente() {
  const navigate = useNavigate();
  const { 
    loading, 
    checkCardAvailability, 
    bindCardToClient 
  } = useCardBinding();

  // Estados do fluxo
  const [step, setStep] = useState('scan'); // 'scan', 'form', 'success'
  const [scannedCard, setScannedCard] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [boundCard, setBoundCard] = useState(null);

  /**
   * Processa QR Code escaneado
   */
  const handleScan = async (qrData) => {
    setSubmitError(null);
    setShowScanner(false);

    try {
      // Extrai UUID do QR Code (formato: QUERMESSEON:uuid)
      let cardUuid = qrData;
      if (qrData.startsWith('QUERMESSEON:')) {
        cardUuid = qrData.replace('QUERMESSEON:', '');
      }

      // Verifica disponibilidade do cartão
      const { available, card, error } = await checkCardAvailability(cardUuid);

      if (error) {
        setSubmitError(error);
        return;
      }

      if (!available) {
        if (card?.status === 'active' && card?.client) {
          setSubmitError(
            `Este cartão já está vinculado ao cliente: ${card.client.name}`
          );
        } else if (card?.status === 'inactive') {
          setSubmitError('Este cartão está inativo');
        } else if (card?.status === 'blocked') {
          setSubmitError('Este cartão está bloqueado');
        } else {
          setSubmitError('Este cartão não está disponível para vinculação');
        }
        return;
      }

      // Cartão disponível, avança para formulário
      setScannedCard(card);
      setStep('form');
    } catch (err) {
      console.error('Erro ao processar QR Code:', err);
      setSubmitError('Erro ao processar QR Code: ' + err.message);
    }
  };

  /**
   * Valida campo do formulário
   */
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
        if (value && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(value)) {
          return 'Telefone inválido. Use formato: (11) 98765-4321';
        }
        return null;

      default:
        return null;
    }
  };

  /**
   * Atualiza campo do formulário
   */
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

  /**
   * Formata telefone enquanto digita
   */
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

  /**
   * Valida formulário completo
   */
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

  /**
   * Submete formulário e vincula cartão
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      setSubmitError('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const { success, card, client, error } = await bindCardToClient(
        scannedCard.uuid,
        formData.name.trim(),
        formData.phone || null
      );

      if (error) {
        setSubmitError(error);
        return;
      }

      if (!success) {
        setSubmitError('Erro ao vincular cartão');
        return;
      }

      // Sucesso! Mostra tela de confirmação
      setBoundCard({ ...card, client });
      setStep('success');
    } catch (err) {
      console.error('Erro ao vincular cartão:', err);
      setSubmitError(err.message || 'Erro ao vincular cartão');
    }
  };

  /**
   * Reinicia o fluxo
   */
  const handleReset = () => {
    setStep('scan');
    setScannedCard(null);
    setFormData({ name: '', phone: '' });
    setErrors({});
    setSubmitError(null);
    setBoundCard(null);
  };

  /**
   * Volta para tela anterior
   */
  const handleBack = () => {
    if (step === 'form') {
      setStep('scan');
      setScannedCard(null);
      setSubmitError(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ativar Cartão</h1>
        </div>
        <p className="text-muted-foreground">
          Vincule e ative um cartão pré-impresso cadastrando um novo cliente
        </p>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Importante:</strong> O cartão só será ativado após vincular a um cliente.
            Cartões não vinculados permanecem inativos (status: pending).
          </AlertDescription>
        </Alert>
      </div>

      {/* PASSO 1: Escanear QR Code */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>Escanear Cartão</CardTitle>
            <CardDescription>
              Escaneie o QR Code do cartão pré-impresso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 py-8">
              <QrCode className="h-24 w-24 text-muted-foreground" />
              
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                disabled={loading}
                className="w-full max-w-xs"
              >
                <Scan className="h-5 w-5 mr-2" />
                {loading ? 'Verificando...' : 'Escanear Cartão'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Posicione o QR Code do cartão na frente da câmera
              </p>
            </div>

            {/* Scanner de QR Code */}
            {showScanner && (
              <div className="mt-4">
                <QrScanner
                  onScan={handleScan}
                  onError={(err) => {
                    setSubmitError('Erro ao escanear: ' + err);
                    setShowScanner(false);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                  className="w-full mt-2"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PASSO 2: Formulário de Cliente */}
      {step === 'form' && scannedCard && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
            <CardDescription>
              Preencha as informações do cliente para vincular o cartão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Info do cartão escaneado */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Cartão Escaneado</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {scannedCard.uuid}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Disponível
                </Badge>
              </div>
            </div>

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
                    autoFocus
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
                <p className="text-xs text-muted-foreground">
                  Opcional - usado para identificar o cliente
                </p>
              </div>

              {/* Mensagem de erro */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Vinculando...' : 'Vincular Cartão'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PASSO 3: Sucesso */}
      {step === 'success' && boundCard && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Cartão Vinculado!</CardTitle>
                <CardDescription>
                  O cartão foi vinculado com sucesso ao cliente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do cliente */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Informações do Cliente</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{boundCard.client.name}</span>
                  </div>
                  {boundCard.client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{boundCard.client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Informações do Cartão</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{boundCard.uuid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saldo:</span>
                    <span className="font-semibold">
                      R$ {parseFloat(boundCard.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruções */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>✅ Cartão Ativado com Sucesso!</strong>
                <p className="mt-2 text-sm">
                  O cartão foi vinculado ao cliente e está agora <strong>ATIVO</strong>.
                  O cliente já pode fazer recargas e compras.
                </p>
                <p className="mt-3 font-semibold">Próximos passos:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-sm">
                  <li>Entregue o cartão físico ao cliente</li>
                  <li>Explique que o cartão está ativo e pronto para uso</li>
                  <li>Cliente pode fazer recarga no caixa a qualquer momento</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/caixa')}
                className="flex-1"
              >
                Voltar ao Caixa
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1"
              >
                Vincular Outro Cartão
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Made with Bob