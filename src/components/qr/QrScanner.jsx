import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, XCircle, CheckCircle2, Keyboard, AlertCircle } from 'lucide-react';

const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

const isLocalhost = () => {
  if (!isBrowser || !window.location) return false;

  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
};

const isSecureCameraContext = () => {
  if (!isBrowser) return false;

  return window.isSecureContext || isLocalhost();
};

const getLegacyGetUserMedia = () => {
  if (!isBrowser) return null;

  return (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    null
  );
};

const getMediaDevicesApi = () => {
  if (!isBrowser) return null;

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices;
  }

  const legacyGetUserMedia = getLegacyGetUserMedia();

  if (!legacyGetUserMedia) {
    return null;
  }

  return {
    getUserMedia: (constraints) =>
      new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      }),
  };
};

const getCameraSupportState = () => {
  if (!isBrowser) {
    return {
      supported: false,
      secureContext: false,
      message: 'Ambiente do navegador não disponível para acessar a câmera.',
    };
  }

  const secureContext = isSecureCameraContext();
  const mediaDevicesApi = getMediaDevicesApi();

  if (!secureContext) {
    return {
      supported: false,
      secureContext: false,
      message: 'A câmera só funciona em HTTPS ou em localhost. Abra este sistema em uma conexão segura para usar o scanner.',
    };
  }

  if (!mediaDevicesApi) {
    return {
      supported: false,
      secureContext: true,
      message: 'Este navegador não oferece suporte à API de câmera. Tente usar Safari/Chrome atualizados ou digite o UUID manualmente.',
    };
  }

  return {
    supported: true,
    secureContext: true,
    message: null,
  };
};

/**
 * Componente para escanear QR Code
 * Espera formato: "QUERMESSE:{uuid}"
 *
 * @param {Object} props
 * @param {Function} props.onScan - Callback quando QR Code é escaneado com sucesso (recebe uuid)
 * @param {Function} props.onError - Callback quando há erro no scan
 * @param {boolean} props.continuous - Modo contínuo (padrão: false)
 */
export default function QrScanner({
  onScan,
  onError,
  continuous = false
}) {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUuid, setManualUuid] = useState('');

  const [cameraSupport, setCameraSupport] = useState(() => getCameraSupportState());

  // Verifica suporte e permissão da câmera
  useEffect(() => {
    const supportState = getCameraSupportState();
    setCameraSupport(supportState);

    if (supportState.supported) {
      checkCameraPermission();
      return;
    }

    setPermissionState('denied');
    setError(supportState.message);
    setShowManualInput(true);
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (!cameraSupport.supported) {
        return;
      }

      // Safari/iOS e alguns navegadores não suportam Permissions API para câmera
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' });
        setPermissionState(result.state);

        if (result.addEventListener) {
          result.addEventListener('change', () => {
            setPermissionState(result.state);
          });
        }
      }
    } catch (err) {
      console.log('Permissions API não disponível para câmera, usando fallback');
    }
  };

  // Solicita permissão da câmera
  const requestCameraPermission = async () => {
    const mediaDevicesApi = getMediaDevicesApi();

    if (!cameraSupport.secureContext) {
      setPermissionState('denied');
      setError('A câmera só pode ser usada em HTTPS ou localhost. Abra o sistema em uma origem segura ou use a entrada manual.');
      return false;
    }

    if (!mediaDevicesApi?.getUserMedia) {
      setPermissionState('denied');
      setError('A API de câmera não está disponível neste navegador. Use um navegador compatível ou digite o UUID manualmente.');
      return false;
    }

    try {
      const stream = await mediaDevicesApi.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      });

      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      setError(null);
      return true;
    } catch (err) {
      console.error('Erro ao solicitar permissão:', err);
      setPermissionState('denied');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador e tente novamente.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('A câmera está em uso por outro aplicativo ou não pôde ser iniciada.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        setError('Não foi possível selecionar uma câmera compatível neste dispositivo.');
      } else if (err.name === 'SecurityError') {
        setError('O navegador bloqueou o acesso à câmera. Verifique se o site está em HTTPS ou localhost.');
      } else {
        setError(`Erro ao acessar câmera: ${err.message || 'falha desconhecida'}`);
      }

      return false;
    }
  };

  // Inicializa o scanner
  useEffect(() => {
    if (!scannerRef.current || !cameraSupport.supported) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      /* verbose= */ false
    );

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, []);

  // Processa o resultado do scan
  const handleScanSuccess = (decodedText) => {
    console.log('QR Code escaneado:', decodedText);

    // Valida formato QUERMESSE:{uuid}
    const match = decodedText.match(/^QUERMESSE:([a-f0-9-]{36})$/i);
    
    if (match) {
      const uuid = match[1];
      setLastScan({ uuid, timestamp: new Date() });
      setError(null);

      if (onScan) {
        onScan(uuid);
      }

      // Para o scanner se não for modo contínuo
      if (!continuous && scanner) {
        stopScanning();
      }
    } else {
      const errorMsg = 'QR Code inválido. Use apenas QR Codes da Quermesse.';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  // Processa erros do scan
  const handleScanError = (error) => {
    // Ignora erros de "não encontrado" que são normais durante o scan
    if (error.includes('NotFoundException')) {
      return;
    }
    
    // Trata erros de permissão
    if (error.includes('NotAllowedError') || error.includes('Permission')) {
      setPermissionState('denied');
      setError('Permissão de câmera negada. Use a entrada manual ou permita o acesso à câmera.');
      stopScanning();
      return;
    }
    
    console.error('Erro no scanner:', error);
  };

  // Inicia o scanner
  const startScanning = async () => {
    if (!scanner || isScanning) return;
    
    if (!cameraSupport.supported) {
      setError(cameraSupport.message);
      setShowManualInput(true);
      return;
    }
    
    // Verifica/solicita permissão primeiro
    if (permissionState !== 'granted') {
      const granted = await requestCameraPermission();
      if (!granted) {
        setShowManualInput(true);
        return;
      }
    }
    
    setIsScanning(true);
    setError(null);
    setLastScan(null);
    setShowManualInput(false);
    
    try {
      scanner.render(handleScanSuccess, handleScanError);
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err);
      setError('Erro ao iniciar scanner. Verifique a permissão da câmera ou use a entrada manual.');
      setIsScanning(false);
      setShowManualInput(true);
    }
  };

  // Para o scanner
  const stopScanning = () => {
    if (scanner && isScanning) {
      scanner.clear().then(() => {
        setIsScanning(false);
      }).catch(console.error);
    }
  };

  // Valida e processa UUID manual
  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    const uuid = manualUuid.trim();
    
    // Valida formato UUID
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    if (!uuid) {
      setError('Por favor, digite o UUID do cartão');
      return;
    }
    
    if (!uuidRegex.test(uuid)) {
      setError('UUID inválido. Formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
      return;
    }
    
    setLastScan({ uuid, timestamp: new Date() });
    setError(null);
    setManualUuid('');
    
    if (onScan) {
      onScan(uuid);
    }
  };

  // Alterna entre scanner e entrada manual
  const toggleManualInput = () => {
    if (isScanning) {
      stopScanning();
    }
    setShowManualInput(!showManualInput);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Scanner de QR Code
        </CardTitle>
        <CardDescription>
          {showManualInput
            ? 'Digite o UUID do cartão manualmente'
            : 'Posicione o QR Code do cartão na câmera'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta de indisponibilidade/permissão da câmera */}
        {!cameraSupport.supported && !showManualInput && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Câmera indisponível</strong>
              <br />
              {cameraSupport.message}
              <br />
              <span className="text-xs">
                Você ainda pode continuar usando a entrada manual do UUID.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {permissionState === 'denied' && cameraSupport.supported && !showManualInput && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Permissão de câmera negada</strong>
              <br />
              Para usar o scanner, permita o acesso à câmera nas configurações do navegador.
              <br />
              <span className="text-xs">
                Ou use a entrada manual clicando no botão abaixo.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Área do scanner */}
        {!showManualInput && (
          <div
            id="qr-reader"
            ref={scannerRef}
            className={`w-full ${!isScanning ? 'hidden' : ''}`}
          />
        )}

        {/* Mensagem quando não está escaneando */}
        {!isScanning && !lastScan && !showManualInput && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Clique no botão abaixo para iniciar o scanner
            </p>
            {permissionState === 'prompt' && (
              <p className="text-xs text-muted-foreground">
                Você precisará permitir o acesso à câmera
              </p>
            )}
          </div>
        )}

        {/* Entrada manual */}
        {showManualInput && !lastScan && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-uuid">UUID do Cartão</Label>
              <Input
                id="manual-uuid"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={manualUuid}
                onChange={(e) => setManualUuid(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Digite o UUID completo do cartão (36 caracteres)
              </p>
            </div>
            <Button type="submit" className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar UUID
            </Button>
          </form>
        )}

        {/* Último scan bem-sucedido */}
        {lastScan && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Cartão identificado com sucesso!</strong>
              <br />
              <span className="font-mono text-xs">UUID: {lastScan.uuid}</span>
              <br />
              <span className="text-xs text-green-600">
                {new Date(lastScan.timestamp).toLocaleString('pt-BR')}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botões de controle */}
        <div className="flex flex-col gap-2">
          {!showManualInput ? (
            <>
              {!isScanning ? (
                <Button
                  onClick={startScanning}
                  className="w-full"
                  disabled={!scanner && cameraSupport.supported}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {!cameraSupport.supported
                    ? 'Câmera Indisponível'
                    : permissionState === 'denied'
                      ? 'Solicitar Permissão'
                      : 'Iniciar Scanner'}
                </Button>
              ) : (
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Parar Scanner
                </Button>
              )}
              <Button
                onClick={toggleManualInput}
                variant="outline"
                className="w-full"
                disabled={isScanning}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                Digitar UUID Manualmente
              </Button>
            </>
          ) : (
            <Button
              onClick={toggleManualInput}
              variant="outline"
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              Voltar para Scanner
            </Button>
          )}
        </div>

        {/* Instruções */}
        {!showManualInput && (
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p className="font-semibold mb-1">Instruções:</p>
            <p>• Use HTTPS ou localhost para liberar acesso à câmera</p>
            <p>• Permita o acesso à câmera quando solicitado</p>
            <p>• No iPhone/iPad, prefira Safari atualizado</p>
            <p>• Mantenha o QR Code bem iluminado</p>
            <p>• Posicione o código dentro da área marcada</p>
            <p>• Se a câmera não funcionar, use a entrada manual</p>
            {continuous && <p>• Modo contínuo: scanner não para após leitura</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Made with Bob
