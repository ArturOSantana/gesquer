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
import { formatCPF, validateCPF, validateBirthDate, isMinor } from '@/lib/validators';
import { extractUuidFromQrCode } from '@/lib/qrCodeUtils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Phone,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Scan,
  Calendar,
  Shield,
  UserCheck
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
  const { toast } = useToast();
  const {
    loading,
    checkCardAvailability,
    bindCardToClient
  } = useCardBinding();

  // Estados do fluxo
  const [step, setStep] = useState('scan'); // 'scan', 'form', 'success'
  const [scannedCard, setScannedCard] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Estados para controle de telefone duplicado
  const [existingClient, setExistingClient] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingCardUuid, setPendingCardUuid] = useState(null);

  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    birthDate: '',
    isMinor: false,
    guardianName: ''
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
      console.log('=== DEBUG SCAN (NOVO CLIENTE) ===');
      console.log('Conteúdo escaneado:', qrData);
      
      // Extrai UUID do QR Code (suporta múltiplos formatos)
      const cardUuid = extractUuidFromQrCode(qrData);
      
      console.log('UUID extraído:', cardUuid);
      console.log('=================================');
      
      if (!cardUuid) {
        setSubmitError('QR Code inválido ou formato não reconhecido');
        return;
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

      case 'cpf':
        if (value) {
          const cpfValidation = validateCPF(value);
          if (!cpfValidation.valid) {
            return cpfValidation.error;
          }
        }
        return null;

      case 'birthDate':
        if (value) {
          const dateValidation = validateBirthDate(value);
          if (!dateValidation.valid) {
            return dateValidation.error;
          }
        }
        return null;

      case 'guardianName':
        if (formData.isMinor && !value.trim()) {
          return 'Nome do responsável é obrigatório para menores de idade';
        }
        if (value && value.trim().length < 3) {
          return 'Nome do responsável deve ter pelo menos 3 caracteres';
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
   * Formata CPF enquanto digita
   */
  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }));

    const error = validateField('cpf', formatted);
    setErrors(prev => ({
      ...prev,
      cpf: error
    }));
  };

  /**
   * Atualiza data de nascimento e verifica se é menor
   */
  const handleBirthDateChange = (e) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      birthDate: value,
      isMinor: value ? isMinor(value) : false
    }));

    const error = validateField('birthDate', value);
    setErrors(prev => ({
      ...prev,
      birthDate: error
    }));
  };

  /**
   * Atualiza checkbox de menor de idade
   */
  const handleIsMinorChange = (e) => {
    const checked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      isMinor: checked,
      guardianName: checked ? prev.guardianName : ''
    }));

    if (!checked) {
      setErrors(prev => ({
        ...prev,
        guardianName: null
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
   * Verifica se telefone já existe no banco de dados
   */
  const checkPhoneExists = async (phone) => {
    if (!phone) {
      return { exists: false, client: null };
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar telefone:', error);
        return { exists: false, client: null };
      }

      return { exists: !!data, client: data };
    } catch (err) {
      console.error('Erro ao verificar telefone:', err);
      return { exists: false, client: null };
    }
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
      // NOVO: Verificar se telefone já existe
      if (formData.phone) {
        const { exists, client } = await checkPhoneExists(formData.phone);
        
        if (exists) {
          // Mostrar diálogo de confirmação
          setExistingClient(client);
          setShowDuplicateDialog(true);
          setPendingCardUuid(scannedCard.uuid);
          return; // Aguarda decisão do usuário
        }
      }

      // Se não existe telefone duplicado, continua normalmente
      await createNewClient();
    } catch (err) {
      console.error('Erro ao vincular cartão:', err);
      setSubmitError(err.message || 'Erro ao vincular cartão');
    }
  };

  /**
   * Cria novo cliente e vincula cartão
   */
  const createNewClient = async () => {
    try {
      // Prepara dados do cliente
      const clientData = {
        name: formData.name.trim(),
        phone: formData.phone || null,
        cpf: formData.cpf || null,
        birth_date: formData.birthDate || null,
        is_minor: formData.isMinor,
        guardian_name: formData.isMinor ? formData.guardianName.trim() : null
      };

      const { success, card, client, error } = await bindCardToClient(
        scannedCard.uuid,
        clientData.name,
        clientData.phone,
        clientData
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
   * Confirma vinculação ao cliente existente
   */
  const handleConfirmExistingClient = async () => {
    try {
      // Vincular cartão ao cliente existente
      const { error } = await supabase
        .from('cards')
        .update({
          client_id: existingClient.id,
          status: 'active'
        })
        .eq('uuid', pendingCardUuid);

      if (error) throw error;

      toast({
        title: 'Cartão vinculado!',
        description: `Cartão vinculado a ${existingClient.name}`,
      });

      // Limpar estados
      setShowDuplicateDialog(false);
      setExistingClient(null);
      setPendingCardUuid(null);

      // Resetar formulário
      setFormData({
        name: '',
        phone: '',
        cpf: '',
        birthDate: '',
        isMinor: false,
        guardianName: ''
      });
      setScannedCard(null);
      setStep('scan');

    } catch (error) {
      console.error('Erro ao vincular cartão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao vincular cartão ao cliente existente',
        variant: 'destructive',
      });
    }
  };

  /**
   * Cancela vinculação ao cliente existente
   */
  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setExistingClient(null);
    setPendingCardUuid(null);
    toast({
      title: 'Operação cancelada',
      description: 'Vinculação cancelada. Você pode alterar o telefone ou cancelar.',
    });
  };

  /**
   * Reinicia o fluxo
   */
  const handleReset = () => {
    setStep('scan');
    setScannedCard(null);
    setFormData({
      name: '',
      phone: '',
      cpf: '',
      birthDate: '',
      isMinor: false,
      guardianName: ''
    });
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

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF
                  <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    className={`pl-9 ${errors.cpf ? 'border-destructive' : ''}`}
                    disabled={loading}
                    maxLength={14}
                  />
                </div>
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Opcional - usado para recuperação de cartão
                </p>
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="birthDate">
                  Data de Nascimento
                  <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleBirthDateChange}
                    className={`pl-9 ${errors.birthDate ? 'border-destructive' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.birthDate && (
                  <p className="text-sm text-destructive">{errors.birthDate}</p>
                )}
              </div>

              {/* Checkbox Menor de Idade */}
              {formData.birthDate && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    id="isMinor"
                    checked={formData.isMinor}
                    onChange={handleIsMinorChange}
                    className="h-4 w-4"
                    disabled={loading}
                  />
                  <Label htmlFor="isMinor" className="cursor-pointer">
                    É menor de idade (menos de 18 anos)
                  </Label>
                </div>
              )}

              {/* Nome do Responsável */}
              {formData.isMinor && (
                <div className="space-y-2">
                  <Label htmlFor="guardianName">
                    Nome do Responsável <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="guardianName"
                      name="guardianName"
                      type="text"
                      placeholder="Nome completo do responsável"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className={`pl-9 ${errors.guardianName ? 'border-destructive' : ''}`}
                      disabled={loading}
                      required={formData.isMinor}
                    />
                  </div>
                  {errors.guardianName && (
                    <p className="text-sm text-destructive">{errors.guardianName}</p>
                  )}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Obrigatório para menores de 18 anos
                    </AlertDescription>
                  </Alert>
                </div>
              )}

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
                <strong>Cartão Ativado com Sucesso!</strong>
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

      {/* DIÁLOGO DE TELEFONE DUPLICADO */}
      {showDuplicateDialog && existingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cliente já cadastrado
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-3 font-medium">
                Um cliente com este telefone já existe:
              </p>
              <div className="space-y-2 bg-white rounded p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="font-semibold text-gray-900">{existingClient.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">{existingClient.phone}</p>
                </div>
                {existingClient.cpf && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-700">CPF: {existingClient.cpf}</p>
                  </div>
                )}
              </div>
            </div>
            
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Atenção:</strong> Deseja vincular este cartão ao cliente existente?
                Se não, cancele e altere o telefone no formulário.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmExistingClient}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Sim, vincular
              </Button>
              <Button
                onClick={handleCancelDuplicate}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

