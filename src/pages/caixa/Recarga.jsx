import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { extractUuidFromQrCode } from '../../lib/qrCodeUtils';
import QrScanner from '../../components/qr/QrScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CreditCard,
  User,
  Phone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Scan,
  Plus,
  TrendingUp
} from 'lucide-react';

/**
 * Página de Recarga do Caixa - OTIMIZADA
 * Layout fixo, sem bloqueios complexos, performance melhorada
 */
export default function Recarga() {
  const navigate = useNavigate();
  const [step, setStep] = useState('scan');
  const [scannedQR, setScannedQR] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [clientData, setClientData] = useState({ name: '', phone: '' });
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Quando escaneia QR Code
  async function handleQRScanned(qrData) {
    setLoading(true);
    setShowScanner(false);

    try {
      console.log('=== DEBUG SCAN (RECARGA) ===');
      console.log('Conteúdo escaneado:', qrData);
      
      // Extrai UUID do QR Code (suporta múltiplos formatos)
      const uuid = extractUuidFromQrCode(qrData);
      
      console.log('UUID extraído:', uuid);
      console.log('============================');
      
      if (!uuid) {
        toast.error('QR Code inválido ou formato não reconhecido');
        setStep('scan');
        return;
      }
      
      setScannedQR(uuid);
      
      // Buscar cartão pelo UUID
      const { data: card, error } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('uuid', uuid)
        .single();

      if (error || !card) {
        // QR Code não cadastrado → ir para cadastro
        setStep('register');
        toast('Novo cartão! Cadastre o cliente', { icon: '📝' });
      } else if (card.status !== 'active') {
        toast.error('Cartão não está ativo');
        setStep('scan');
      } else {
        // QR Code já cadastrado → ir para recarga
        setCardData(card);
        setStep('confirm');
      }
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      toast.error('Erro ao verificar cartão');
      setStep('scan');
    } finally {
      setLoading(false);
    }
  }

  // Cadastrar novo cliente
  async function handleRegisterClient(e) {
    e.preventDefault();
    
    if (!clientData.name.trim()) {
      toast.error('Preencha o nome do cliente');
      return;
    }

    setLoading(true);

    try {
      // Criar cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: clientData.name.trim(),
          phone: clientData.phone.trim() || null
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Criar cartão
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          uuid: scannedQR,
          client_id: client.id,
          balance: 0,
          status: 'active'
        })
        .select(`
          *,
          client:clients(*)
        `)
        .single();

      if (cardError) throw cardError;

      setCardData(card);
      setStep('confirm');
      toast.success('Cliente cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  }

  // Confirmar recarga
  async function handleConfirmRecharge() {
    const amount = parseFloat(rechargeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setLoading(true);

    try {
      const previousBalance = parseFloat(cardData.balance) || 0;
      const newBalance = previousBalance + amount;

      // Atualizar saldo
      const { error: updateError } = await supabase
        .from('cards')
        .update({ balance: newBalance })
        .eq('uuid', cardData.uuid);

      if (updateError) throw updateError;

      // Registrar transação
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          card_id: cardData.uuid,
          type: 'recharge',
          amount: amount,
          balance_before: previousBalance,
          balance_after: newBalance
        });

      if (transactionError) throw transactionError;

      // Atualizar estado local
      setCardData(prev => ({ ...prev, balance: newBalance, previousBalance }));
      setStep('success');
      toast.success('Recarga realizada com sucesso!');
    } catch (error) {
      console.error('Erro ao recarregar:', error);
      toast.error('Erro ao processar recarga');
    } finally {
      setLoading(false);
    }
  }

  // Resetar para nova recarga
  function handleNewRecharge() {
    setStep('scan');
    setScannedQR(null);
    setCardData(null);
    setClientData({ name: '', phone: '' });
    setRechargeAmount('');
    setShowScanner(false);
  }

  // Voltar - simplificado
  function handleBack() {
    if (loading) {
      toast.error('Aguarde a operação atual finalizar');
      return;
    }
    navigate('/caixa');
  }

  // Formatar telefone
  function formatPhoneInput(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 2) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      if (numbers.length > 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
      return formatted;
    }
    return clientData.phone;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header fixo - altura fixa */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm h-[72px]">
        <div className="container mx-auto px-4 h-full max-w-2xl">
          <div className="flex items-center justify-between gap-3 h-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                disabled={loading}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Recarga de Cartão</h1>
                <p className="text-sm text-muted-foreground">
                  {step === 'scan' && 'Escaneie o QR Code'}
                  {step === 'register' && 'Cadastrar Cliente'}
                  {step === 'confirm' && 'Confirmar Recarga'}
                  {step === 'success' && 'Recarga Concluída'}
                </p>
              </div>
            </div>
            
            {/* Indicador de progresso - fixo */}
            <div className="flex gap-2 shrink-0">
              <div className={`h-2 w-2 rounded-full transition-colors ${step === 'scan' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full transition-colors ${step === 'register' || step === 'confirm' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full transition-colors ${step === 'success' ? 'bg-green-600' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo - altura fixa para cards principais */}
      <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
        {/* PASSO 1: Escanear QR Code - altura fixa */}
        {step === 'scan' && (
          <div className="space-y-4">
            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Escanear Cartão
                </CardTitle>
                <CardDescription>
                  Posicione o QR Code do cartão na frente da câmera
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showScanner ? (
                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className="h-32 w-32 rounded-full bg-blue-50 flex items-center justify-center">
                      <CreditCard className="h-16 w-16 text-blue-600" />
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={() => setShowScanner(true)}
                      disabled={loading}
                      className="w-full max-w-xs h-14 text-lg"
                    >
                      <Scan className="h-5 w-5 mr-2" />
                      {loading ? 'Verificando...' : 'Iniciar Scanner'}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground max-w-sm">
                      O sistema identificará automaticamente se é um cartão novo ou já cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <QrScanner
                      onScan={handleQRScanned}
                      onError={(err) => {
                        toast.error('Erro ao escanear: ' + err);
                        setShowScanner(false);
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowScanner(false)}
                      className="w-full h-12"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Dica:</strong> Mantenha o QR Code bem iluminado e centralizado na câmera para melhor leitura.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* PASSO 2: Cadastrar Cliente - altura fixa */}
        {step === 'register' && (
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Novo Cartão Detectado
              </CardTitle>
              <CardDescription>
                Cadastre os dados do cliente para ativar o cartão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterClient} className="space-y-6">
                {/* UUID do cartão */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Cartão:</span>
                    <span className="font-mono text-xs text-blue-700">{scannedQR?.substring(0, 8)}...</span>
                  </div>
                </div>

                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={clientData.name}
                      onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome do cliente"
                      className="pl-10 h-14 text-lg"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">
                    Telefone <span className="text-muted-foreground text-sm">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={clientData.phone}
                      onChange={(e) => setClientData(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
                      placeholder="(00) 00000-0000"
                      className="pl-10 h-14 text-lg"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 h-14 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !clientData.name.trim()}
                    className="flex-[2] h-14 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar e Continuar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* PASSO 3: Confirmar Recarga - layout fixo */}
        {step === 'confirm' && cardData && (
          <div className="space-y-4">
            {/* Informações do Cliente - altura fixa */}
            <Card className="min-h-[180px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-semibold text-lg">{cardData.client.name}</span>
                  </div>
                  {cardData.client.phone && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{cardData.client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3 border-t-2">
                    <span className="text-muted-foreground font-medium">Saldo Atual:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(cardData.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valor da Recarga - altura fixa */}
            <Card className="min-h-[320px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valor da Recarga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base">
                    Digite o valor
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0,00"
                      className="pl-16 h-16 text-3xl font-bold text-center"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Botões de Valor Rápido */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Valores rápidos:
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50, 100, 200, 500].map(value => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        onClick={() => setRechargeAmount(value.toString())}
                        className="h-12 text-base font-semibold hover:bg-blue-50 hover:border-blue-300"
                      >
                        R$ {value}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview do Novo Saldo - altura fixa */}
            {rechargeAmount && parseFloat(rechargeAmount) > 0 && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50 min-h-[200px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    Preview da Recarga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Saldo Anterior:</span>
                    <span className="text-xl font-bold text-gray-600">
                      {formatCurrency(cardData.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Valor a Carregar:</span>
                    <span className="text-xl font-bold text-blue-600">
                      + {formatCurrency(parseFloat(rechargeAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-green-300">
                    <span className="font-semibold text-green-700">Novo Saldo:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(parseFloat(cardData.balance) + parseFloat(rechargeAmount))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 h-14 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmRecharge}
                disabled={loading || !rechargeAmount || parseFloat(rechargeAmount) <= 0}
                className="flex-[2] h-14 text-base bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processando...' : 'Confirmar Recarga'}
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 4: Sucesso */}
        {step === 'success' && cardData && (
          <div className="space-y-4">
            <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">
                      Recarga Realizada!
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {cardData.client.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Resumo da Recarga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Saldo Anterior:</span>
                    <span className="text-xl font-bold text-gray-400 line-through">
                      {formatCurrency(cardData.previousBalance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Valor Carregado:</span>
                    <span className="text-xl font-bold text-blue-600">
                      + {formatCurrency(parseFloat(rechargeAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2">
                    <span className="font-semibold text-lg">Novo Saldo:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(cardData.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Sucesso!</strong> O saldo foi creditado no cartão do cliente.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/caixa')}
                className="flex-1 h-14 text-base"
              >
                Voltar ao Caixa
              </Button>
              <Button
                onClick={handleNewRecharge}
                className="flex-[2] h-14 text-base bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Recarga
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
