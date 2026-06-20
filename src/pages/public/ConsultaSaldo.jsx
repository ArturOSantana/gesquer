import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QrScanner from '../../components/qr/QrScanner'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { extractUuidFromQrCode } from '../../lib/qrCodeUtils'

export default function ConsultaSaldo() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  
  const handleScan = (scannedData) => {
    try {
      setError(null)
      
      console.log('=== DEBUG SCAN (CONSULTA SALDO) ===')
      console.log('Conteúdo escaneado:', scannedData)
      
      // Extrai UUID do QR Code (suporta múltiplos formatos)
      const cardUuid = extractUuidFromQrCode(scannedData)
      
      console.log('UUID extraído:', cardUuid)
      console.log('===================================')
      
      if (!cardUuid) {
        setError('QR Code inválido. Por favor, escaneie o QR Code do seu cartão.')
        return
      }
      
      // Redirecionar para página de exibição
      navigate(`/consulta/${cardUuid}`)
    } catch (err) {
      console.error('Erro ao processar QR Code:', err)
      setError('Erro ao processar QR Code. Tente novamente.')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            🎪 Consultar Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">
                Escaneie o QR Code do seu cartão com a câmera do celular
              </p>
              <p className="text-sm text-gray-500">
                Ou use o scanner abaixo se já estiver nesta página
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <QrScanner onScan={handleScan} />
            
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <p className="text-sm text-gray-700 text-center">
                <strong>💡 Dica:</strong> Mantenha o QR Code bem iluminado e centralizado na câmera
              </p>
              <p className="text-xs text-gray-600 text-center">
                O QR Code do cartão contém um link direto para consulta de saldo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Made with Bob
