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
import { extractUuidFromQrCode } from '@/lib/qrCodeUtils';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Scan,
  User,
  Phone,
  DollarSign,
  Search
} from 'lucide-react';

/**
 * Página do Caixa: Transferir Cartão (Substituição Simplificada)
 * 
 * Fluxo Simplificado:
 * 1. Buscar cliente por TELEFONE + NOME (sem QR Code)
 * 2. Validar identidade do cliente
 * 3. Escanear cartão novo (destino - do lote)
 * 4. Verificar se cartão novo está disponível
 * 5. Transferir saldo automaticamente
 * 6. Vincular cartão novo ao mesmo cliente
 * 7. Desativar cartão antigo
 */
export default function TransferirCartao() {
  const navigate = useNavigate();
  const { 
    loading, 
    checkCardAvailability,
    transferCardBalance 
  } = useCardBinding();

  // Estados do fluxo
  const [step, setStep] = useState('search'); // 'search', 'scan-new', 'confirm', 'success'
  
  // Dados de busca
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  
  // Dados do cliente e cartões
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [newCard, setNewCard] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [submitError, setSubmitError] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  /**
   * Busca cliente por telefone e nome (query direta no Supabase)
   */
  const handleBuscarCliente = async () => {
    try {
      setLoading(true);
      setSubmitError('');
      setClienteEncontrado(null);

      // Sanitiza telefone (remove caracteres não numéricos)
      const telefoneSanitizado = telefone.replace(/\D/g, '');
      
      if (telefoneSanitizado.length < 10) {
        setSubmitError('Telefone deve ter pelo menos 10 dígitos');
        return;
      }

      if (!nome.trim()) {
        setSubmitError('Nome é obrigatório');
        return;
      }

      console.log('=== BUSCA DE CLIENTE ===');
      console.log('Telefone:', telefoneSanitizado);
      console.log('Nome:', nome.trim());

      // Busca direta no Supabase (SEM função SQL)
      const { data: clientes, error: searchError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          phone,
          cpf,
          is_minor,
          guardian_name,
          cards!inner(
            id,
            uuid,
            balance,
            status
          )
        `)
        .eq('phone', telefoneSanitizado)
        .ilike('name', `%${nome.trim()}%`)
        .eq('cards.status', 'active')
        .single();

      console.log('Resultado da busca:', clientes);
      console.log('Erro:', searchError);

      if (searchError || !clientes) {
        setSubmitError('Cliente não encontrado com esse telefone e nome. Verifique os dados e tente novamente.');
        return;
      }

      // Verifica se tem cartão ativo
      if (!clientes.cards || clientes.cards.length === 0) {
        setSubmitError('Cliente não possui cartão ativo');
        return;
      }

      // Formata dados do cliente
      const clienteData = {
        id: clientes.id,
        name: clientes.name,
        phone: clientes.phone,
        has_cpf: !!clientes.cpf,
        is_minor: clientes.is_minor,
        guardian_name: clientes.guardian_name,
        current_balance: clientes.cards[0].balance,
        card_qr_code: clientes.cards[0].uuid,
        card_id: clientes.cards[0].id
      };

      console.log('Cliente encontrado:', clienteData);
      setClienteEncontrado(clienteData);
      setStep('scan-new');

    } catch (err) {
      console.error('Erro ao buscar cliente:', err);
      setSubmitError('Erro ao buscar cliente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processa QR Code do cartão novo
   */
  const handleScanNewCard = async (qrData) => {
    setSubmitError(null);
    setShowScanner(false);

    try {
      console.log('=== DEBUG SCAN (CARTÃO NOVO) ===');
      console.log('Conteúdo escaneado:', qrData);
      
      // Extrai UUID do QR Code (suporta múltiplos formatos)
      const cardUuid = extractUuidFromQrCode(qrData);
      
      console.log('UUID extraído:', cardUuid);
      console.log('================================');
      
      if (!cardUuid) {
        setSubmitError('QR Code inválido ou formato não reconhecido');
        return;
      }

      // Verifica se não é o mesmo cartão
      if (cardUuid === clienteEncontrado.card_qr_code) {
        setSubmitError('Não é possível transferir para o mesmo cartão');
        return;
      }

      // Verifica disponibilidade do cartão novo
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
          setSubmitError('Este cartão não está disponível');
        }
        return;
      }

      // Cartão novo válido, avança para confirmação
      setNewCard(card);
      setStep('confirm');
    } catch (err) {
      console.error('Erro ao processar cartão novo:', err);
      setSubmitError('Erro ao processar cartão: ' + err.message);
    }
  };

  /**
   * Confirma e executa a transferência
   */
  const handleConfirmTransfer = async () => {
    setSubmitError(null);

    try {
      const { success, oldCard: updatedOldCard, newCard: updatedNewCard, transferredAmount, error } = 
        await transferCardBalance(clienteEncontrado.card_qr_code, newCard.uuid);

      if (error) {
        setSubmitError(error);
        return;
      }

      if (!success) {
        setSubmitError('Erro ao transferir saldo');
        return;
      }

      // Sucesso! Mostra tela de confirmação
      setTransferResult({
        oldCard: updatedOldCard,
        newCard: updatedNewCard,
        transferredAmount
      });
      setStep('success');
    } catch (err) {
      console.error('Erro ao transferir saldo:', err);
      setSubmitError(err.message || 'Erro ao transferir saldo');
    }
  };

  /**
   * Reinicia o fluxo
   */
  const handleReset = () => {
    setStep('search');
    setTelefone('');
    setNome('');
    setClienteEncontrado(null);
    setNewCard(null);
    setSubmitError(null);
    setTransferResult(null);
  };

  /**
   * Volta para tela anterior
   */
  const handleBack = () => {
    if (step === 'scan-new') {
      setStep('search');
      setClienteEncontrado(null);
      setNewCard(null);
      setSubmitError(null);
    } else if (step === 'confirm') {
      setStep('scan-new');
      setNewCard(null);
      setSubmitError(null);
    } else {
      navigate(-1);
    }
  };

  /**
   * Formata telefone para exibição
   */
  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
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
          <h1 className="text-3xl font-bold">Transferir Cartão</h1>
        </div>
        <p className="text-muted-foreground">
          Substitua um cartão desgastado ou perdido
        </p>
      </div>

      {/* PASSO 1: Buscar Cliente por Telefone + Nome */}
      {step === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar Cliente</CardTitle>
            <CardDescription>
              Informe o telefone e nome do cliente para localizar o cartão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Use esta opção quando o cartão estiver 
                ilegível, perdido ou danificado. O cliente precisa fornecer telefone 
                e nome para validação de identidade.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Campo Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone do Cliente
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={loading}
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">
                  Digite apenas números ou com formatação
                </p>
              </div>

              {/* Campo Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome do Cliente
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Nome completo ou parcial"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Pode ser nome parcial (ex: "João" ou "Silva")
                </p>
              </div>
            </div>

            {/* Botão Buscar */}
            <Button
              onClick={handleBuscarCliente}
              disabled={loading || !telefone || !nome}
              className="w-full"
              size="lg"
            >
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Buscando...' : 'Buscar Cliente'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PASSO 2: Escanear Cartão Novo */}
      {step === 'scan-new' && clienteEncontrado && (
        <Card>
          <CardHeader>
            <CardTitle>Escanear Cartão Novo</CardTitle>
            <CardDescription>
              Escaneie o QR Code do cartão novo (do lote)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info do cliente encontrado */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cliente Encontrado</h3>
                <Badge variant="outline">Cartão Ativo</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{clienteEncontrado.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(clienteEncontrado.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    Saldo Atual: R$ {parseFloat(clienteEncontrado.current_balance || 0).toFixed(2)}
                  </span>
                </div>
                {clienteEncontrado.is_minor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">
                      Responsável: {clienteEncontrado.guardian_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <CreditCard className="h-24 w-24 text-muted-foreground" />
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">2</span>
                </div>
              </div>
              
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                disabled={loading}
                className="w-full max-w-xs"
              >
                <Scan className="h-5 w-5 mr-2" />
                {loading ? 'Verificando...' : 'Escanear Cartão Novo'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Escaneie um cartão novo do lote disponível
              </p>
            </div>

            {/* Scanner de QR Code */}
            {showScanner && (
              <div className="mt-4">
                <QrScanner
                  onScan={handleScanNewCard}
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

      {/* PASSO 3: Confirmar Transferência */}
      {step === 'confirm' && clienteEncontrado && newCard && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Transferência</CardTitle>
            <CardDescription>
              Revise as informações antes de confirmar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cartão Antigo */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-red-900">Cartão Antigo (Origem)</h3>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  Será Desativado
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-red-600" />
                  <span className="text-red-900">{clienteEncontrado.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span className="font-mono text-xs text-red-900">{clienteEncontrado.card_qr_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-900">
                    R$ {parseFloat(clienteEncontrado.current_balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Seta de transferência */}
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Cartão Novo */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-900">Cartão Novo (Destino)</h3>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Será Ativado
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-green-900">{clienteEncontrado.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-xs text-green-900">{newCard.uuid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">
                    R$ {parseFloat(clienteEncontrado.current_balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagem de erro */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Aviso */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> O saldo será transferido automaticamente
                e o cartão antigo será desativado.
              </AlertDescription>
            </Alert>

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
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Transferindo...' : 'Confirmar Transferência'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PASSO 4: Sucesso */}
      {step === 'success' && transferResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Transferência Concluída!</CardTitle>
                <CardDescription>
                  O saldo foi transferido com sucesso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo da transferência */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Resumo da Transferência</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{transferResult.newCard.client.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Transferido:</span>
                  <span className="font-semibold text-green-600">
                    R$ {parseFloat(transferResult.transferredAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Novo Cartão:</span>
                  <span className="font-mono text-xs">{transferResult.newCard.uuid.substring(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Instruções */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Próximos passos:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Entregue o novo cartão ao cliente</li>
                  <li>Recolha o cartão antigo (se disponível)</li>
                  <li>O cartão antigo foi desativado automaticamente</li>
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
                Nova Transferência
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
