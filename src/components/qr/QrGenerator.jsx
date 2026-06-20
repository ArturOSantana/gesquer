import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, RefreshCw, AlertCircle, Wifi } from 'lucide-react';

/**
 * Componente para gerar QR Code a partir de UUID
 * Formato: URL completa para consulta de saldo
 * Exemplo: "https://seu-dominio.com/consulta/uuid"
 *
 * @param {Object} props
 * @param {string} props.uuid - UUID do cartão
 * @param {number} props.size - Tamanho do QR Code (padrão: 256)
 * @param {string} props.title - Título opcional
 * @param {boolean} props.showDownload - Mostrar botão de download (padrão: true)
 */
export default function QrGenerator({ 
  uuid, 
  size = 256, 
  title = 'QR Code do Cartão',
  showDownload = true 
}) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);

  /**
   * Obtém a URL base para o QR Code
   * Suporta:
   * - 'auto': detecta automaticamente o IP da rede
   * - URL específica: usa a URL configurada
   * - undefined: usa window.location.origin
   */
  const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_APP_URL;
    
    // Se for 'auto', usa window.location.origin que já tem o IP correto
    if (envUrl === 'auto') {
      console.log('🔄 Modo AUTO: Usando', window.location.origin);
      return window.location.origin;
    }
    
    // Se for localhost, avisa que não vai funcionar em outros dispositivos
    if (envUrl && envUrl.includes('localhost')) {
      console.warn('⚠️ QR Code usando localhost - não funcionará em outros dispositivos!');
      console.warn('💡 Configure VITE_APP_URL com o IP da rede ou use "auto"');
      console.warn(`📱 Exemplo: VITE_APP_URL=http://192.168.1.100:3000`);
    }
    
    return envUrl || window.location.origin;
  };

  // Gera o QR Code
  const generateQRCode = async () => {
    if (!uuid) {
      setError('UUID não fornecido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Gera URL completa para consulta de saldo
      const url = getBaseUrl();
      setBaseUrl(url);
      setIsLocalhost(url.includes('localhost') || url.includes('127.0.0.1'));
      
      const qrData = `${url}/consulta/${uuid}`;
      const canvas = canvasRef.current;

      if (canvas) {
        await QRCode.toCanvas(canvas, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H' // Alta correção de erros
        });
      }
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      setError('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  // Gera QR Code quando UUID muda
  useEffect(() => {
    generateQRCode();
  }, [uuid, size]);

  // Função para baixar o QR Code
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${uuid}.png`;
      link.href = url;
      link.click();
    }
  };

  if (!uuid) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            UUID não fornecido
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Escaneie com a câmera do celular para consultar o saldo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {loading && (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {error && (
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateQRCode}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`border rounded-lg ${loading || error ? 'hidden' : ''}`}
        />

        {/* Aviso se estiver usando localhost */}
        {isLocalhost && !loading && !error && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>⚠️ Atenção: Localhost Detectado</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>
                Este QR Code usa <strong>localhost</strong> e <strong>não funcionará</strong> em outros dispositivos (iPhone, Android, etc).
              </p>
              <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                <p className="font-semibold mb-1">✅ Para corrigir:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Verifique o IP da rede no terminal (linha "Network:")</li>
                  <li>Atualize <code className="bg-muted px-1 rounded">.env.local</code>:</li>
                </ol>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
VITE_APP_URL=auto
                </pre>
                <p className="mt-1">ou use o IP específico:</p>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
VITE_APP_URL=http://192.168.1.X:3000
                </pre>
                <li className="mt-1">Reinicie o servidor: <code className="bg-muted px-1 rounded">npm run dev</code></li>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Informação da URL sendo usada */}
        {!isLocalhost && !loading && !error && (
          <Alert className="w-full">
            <Wifi className="h-4 w-4" />
            <AlertTitle>✅ QR Code Configurado para Rede</AlertTitle>
            <AlertDescription className="text-sm">
              <p>Este QR Code funcionará em qualquer dispositivo na mesma rede Wi-Fi.</p>
              <p className="mt-1 text-xs text-muted-foreground">URL: {baseUrl}</p>
            </AlertDescription>
          </Alert>
        )}

        {showDownload && !loading && !error && (
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar QR Code
          </Button>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>UUID: {uuid}</p>
          <p className="mt-1">URL: {baseUrl}/consulta/{uuid}</p>
        </div>
      </CardContent>
    </Card>
  );
}

