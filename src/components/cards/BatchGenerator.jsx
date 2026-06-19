import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useBatch } from '../../hooks/useBatch';

export function BatchGenerator() {
  const [quantity, setQuantity] = useState(10);
  const [description, setDescription] = useState('');
  const [generatedBatch, setGeneratedBatch] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const canvasRef = useRef(null);

  const { loading, error, generateBatch, exportBatchCSV, exportBatchJSON } = useBatch();

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 1000) {
      alert('Quantidade deve estar entre 1 e 1000');
      return;
    }

    const result = await generateBatch(quantity, description);

    if (result.success) {
      setGeneratedBatch(result.batch);
      
      // Gera QR Codes
      const codes = await Promise.all(
        result.cards.map(async (card) => {
          const qrData = `QUERMESSE:${card.uuid}`;
          const qrCodeUrl = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          return {
            ...card,
            qrCodeUrl
          };
        })
      );
      
      setQrCodes(codes);
    }
  };

  const handleExportCSV = () => {
    if (generatedBatch && qrCodes.length > 0) {
      exportBatchCSV(generatedBatch, qrCodes);
    }
  };

  const handleExportJSON = () => {
    if (generatedBatch && qrCodes.length > 0) {
      exportBatchJSON(generatedBatch, qrCodes);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Lote de Cartões</CardTitle>
          <CardDescription>
            Crie múltiplos cartões pré-pagos para impressão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade de Cartões</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex: 50"
              />
              <p className="text-sm text-gray-500">
                Mínimo: 1 | Máximo: 1000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Lote para evento de Natal"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || quantity < 1}
            className="w-full"
          >
            {loading ? 'Gerando...' : `Gerar ${quantity} Cartões`}
          </Button>
        </CardContent>
      </Card>

      {generatedBatch && qrCodes.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Lote Gerado com Sucesso</CardTitle>
              <CardDescription>
                Código do Lote: <strong>{generatedBatch.batch_code}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-medium">{qrCodes.length} cartões</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="font-medium">
                    {new Date(generatedBatch.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                {description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descrição:</span>
                    <span className="font-medium">{description}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePrintPDF} variant="default">
                  Imprimir PDF
                </Button>
                <Button onClick={handleExportCSV} variant="outline">
                  Exportar CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline">
                  Exportar JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="print:hidden">
              <CardTitle>Preview dos Cartões</CardTitle>
              <CardDescription>
                {qrCodes.length} cartões prontos para impressão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                {qrCodes.map((card, index) => (
                  <div
                    key={card.id}
                    className="border rounded-lg p-4 flex flex-col items-center space-y-2 print:break-inside-avoid print:border-2 print:border-gray-300"
                  >
                    <div className="text-xs text-gray-500 print:text-black">
                      #{index + 1}
                    </div>
                    <img
                      src={card.qrCodeUrl}
                      alt={`QR Code ${card.uuid}`}
                      className="w-32 h-32 print:w-24 print:h-24"
                    />
                    <div className="text-center space-y-1">
                      <p className="text-xs font-mono text-gray-600 break-all print:text-[8px]">
                        {card.uuid}
                      </p>
                      <p className="text-xs text-gray-500 print:text-[8px]">
                        {generatedBatch.batch_code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Made with Bob
