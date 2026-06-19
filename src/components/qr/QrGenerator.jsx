import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw } from 'lucide-react';

/**
 * Componente para gerar QR Code a partir de UUID
 * Formato: "QUERMESSE:{uuid}"
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

  // Gera o QR Code
  const generateQRCode = async () => {
    if (!uuid) {
      setError('UUID não fornecido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qrData = `QUERMESSE:${uuid}`;
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
          Escaneie este código para acessar o cartão
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
        </div>
      </CardContent>
    </Card>
  );
}

// Made with Bob
