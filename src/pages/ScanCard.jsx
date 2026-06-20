import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import QrScanner from '@/components/qr/QrScanner';
import CardDetails from '@/components/cards/CardDetails';
import { useCards } from '@/hooks/useCards';
import { extractUuidFromQrCode } from '@/lib/qrCodeUtils';
import { Camera, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

/**
 * Página para escanear QR Code de cartões
 * Permite visualizar informações do cartão após scan
 */
export default function ScanCard() {
  const navigate = useNavigate();
  const { getCardByUuid } = useCards();
  
  const [scannedCard, setScannedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Processa QR Code escaneado
  const handleScan = async (qrData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('=== DEBUG SCAN (SCAN CARD) ===');
      console.log('Conteúdo escaneado:', qrData);
      
      // Extrai UUID do QR Code (suporta múltiplos formatos)
      const uuid = extractUuidFromQrCode(qrData);
      
      console.log('UUID extraído:', uuid);
      console.log('==============================');
      
      if (!uuid) {
        setError('QR Code inválido ou formato não reconhecido');
        return;
      }

      const { data, error: fetchError } = await getCardByUuid(uuid);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      if (!data) {
        setError('Cartão não encontrado no sistema');
        return;
      }

      setScannedCard(data);
      setSuccess(true);
    } catch (err) {
      console.error('Erro ao buscar cartão:', err);
      setError('Erro ao buscar informações do cartão');
    } finally {
      setLoading(false);
    }
  };

  // Processa erro do scanner
  const handleScanError = (errorMsg) => {
    setError(errorMsg);
    setSuccess(false);
  };

  // Reseta para escanear novo cartão
  const handleScanNew = () => {
    setScannedCard(null);
    setError(null);
    setSuccess(false);
  };

  // Atualiza cartão após modificação
  const handleCardUpdate = (updatedCard) => {
    setScannedCard(updatedCard);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Camera className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Escanear Cartão</h1>
        </div>
        <p className="text-muted-foreground">
          Use a câmera para escanear o QR Code do cartão
        </p>
      </div>

      {/* Mensagens de status */}
      {loading && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Buscando informações do cartão...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !scannedCard && (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            QR Code escaneado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo principal */}
      {!scannedCard ? (
        // Scanner
        <div className="grid gap-6 md:grid-cols-1">
          <QrScanner 
            onScan={handleScan}
            onError={handleScanError}
            continuous={false}
          />

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Como usar</CardTitle>
              <CardDescription>
                Siga estas instruções para escanear o cartão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Permita o acesso à câmera</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Permitir" quando o navegador solicitar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Posicione o QR Code</p>
                  <p className="text-sm text-muted-foreground">
                    Centralize o código dentro da área marcada
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Aguarde a leitura</p>
                  <p className="text-sm text-muted-foreground">
                    O sistema irá processar automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Detalhes do cartão escaneado
        <div className="space-y-4">
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  Cartão escaneado com sucesso!
                </p>
              </div>
            </CardContent>
          </Card>

          <CardDetails 
            card={scannedCard}
            onUpdate={handleCardUpdate}
          />

          <Button 
            onClick={handleScanNew}
            className="w-full"
            variant="outline"
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear Outro Cartão
          </Button>
        </div>
      )}
    </div>
  );
}

