import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import QrScanner from '@/components/qr/QrScanner';
import { useCardBinding } from '@/hooks/useCardBinding';
import { 
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Scan,
  User,
  Phone,
  DollarSign
} from 'lucide-react';

/**
 * Página do Caixa: Transferir Cartão (Substituição)
 * 
 * Fluxo:
 * 1. Escanear cartão antigo (origem)
 * 2. Verificar se cartão está ativo e tem cliente
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
    getCardByUuid,
    checkCardAvailability,
    transferCardBalance 
  } = useCardBinding();

  // Estados do fluxo
  const [step, setStep] = useState('scan-old'); // 'scan-old', 'scan-new', 'confirm', 'success'
  const [oldCard, setOldCard] = useState(null);
  const [newCard, setNewCard] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState('old'); // 'old' ou 'new'

  const [submitError, setSubmitError] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  /**
   * Processa QR Code do cartão antigo
   */
  const handleScanOldCard = async (qrData) => {
    setSubmitError(null);
    setShowScanner(false);

    try {
      // Extrai UUID do QR Code
      let cardUuid = qrData;
      if (qrData.startsWith('QUERMESSE:')) {
        cardUuid = qrData.replace('QUERMESSE:', '');
      }

      // Busca informações do cartão
      const { card, error } = await getCardByUuid(cardUuid);

      if (error) {
        setSubmitError(error);
        return;
      }

      // Valida cartão antigo
      if (card.status !== 'active') {
        setSubmitError('Cartão antigo não está ativo');
        return;
      }

      if (!card.client_id || !card.client) {
        setSubmitError('Cartão antigo não está vinculado a um cliente');
        return;
      }

      // Cartão válido, avança para próximo passo
      setOldCard(card);
      setStep('scan-new');
    } catch (err) {
      console.error('Erro ao processar cartão antigo:', err);
      setSubmitError('Erro ao processar cartão: ' + err.message);
    }
  };

  /**
   * Processa QR Code do cartão novo
   */
  const handleScanNewCard = async (qrData) => {
    setSubmitError(null);
    setShowScanner(false);

    try {
      // Extrai UUID do QR Code
      let cardUuid = qrData;
      if (qrData.startsWith('QUERMESSE:')) {
        cardUuid = qrData.replace('QUERMESSE:', '');
      }

      // Verifica se não é o mesmo cartão
      if (cardUuid === oldCard.uuid) {
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
        await transferCardBalance(oldCard.uuid, newCard.uuid);

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
    setStep('scan-old');
    setOldCard(null);
    setNewCard(null);
    setSubmitError(null);
    setTransferResult(null);
  };

  /**
   * Volta para tela anterior
   */
  const handleBack = () => {
    if (step === 'scan-new') {
      setStep('scan-old');
      setOldCard(null);
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
   * Abre scanner
   */
  const openScanner = (mode) => {
    setScannerMode(mode);
    setShowScanner(true);
    setSubmitError(null);
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
          Substitua um cartão desgastado por um novo
        </p>
      </div>

      {/* PASSO 1: Escanear Cartão Antigo */}
      {step === 'scan-old' && (
        <Card>
          <CardHeader>
            <CardTitle>Escanear Cartão Antigo</CardTitle>
            <CardDescription>
              Escaneie o QR Code do cartão que será substituído
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
              <div className="relative">
                <QrCode className="h-24 w-24 text-muted-foreground" />
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">1</span>
                </div>
              </div>
              
              <Button
                size="lg"
                onClick={() => openScanner('old')}
                disabled={loading}
                className="w-full max-w-xs"
              >
                <Scan className="h-5 w-5 mr-2" />
                {loading ? 'Verificando...' : 'Escanear Cartão Antigo'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Escaneie o cartão que o cliente deseja substituir
              </p>
            </div>

            {/* Scanner de QR Code */}
            {showScanner && scannerMode === 'old' && (
              <div className="mt-4">
                <QrScanner
                  onScan={handleScanOldCard}
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

      {/* PASSO 2: Escanear Cartão Novo */}
      {step === 'scan-new' && oldCard && (
        <Card>
          <CardHeader>
            <CardTitle>Escanear Cartão Novo</CardTitle>
            <CardDescription>
              Escaneie o QR Code do cartão novo (do lote)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info do cartão antigo */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cartão Antigo</h3>
                <Badge variant="outline">Ativo</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{oldCard.client.name}</span>
                </div>
                {oldCard.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{oldCard.client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    Saldo: R$ {parseFloat(oldCard.balance || 0).toFixed(2)}
                  </span>
                </div>
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
                <QrCode className="h-24 w-24 text-muted-foreground" />
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">2</span>
                </div>
              </div>
              
              <Button
                size="lg"
                onClick={() => openScanner('new')}
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
            {showScanner && scannerMode === 'new' && (
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
      {step === 'confirm' && oldCard && newCard && (
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
                  <span className="text-red-900">{oldCard.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span className="font-mono text-xs text-red-900">{oldCard.uuid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-900">
                    R$ {parseFloat(oldCard.balance || 0).toFixed(2)}
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
                  <span className="text-green-900">{oldCard.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-xs text-green-900">{newCard.uuid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">
                    R$ {parseFloat(oldCard.balance || 0).toFixed(2)}
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
                  <li>Recolha o cartão antigo</li>
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