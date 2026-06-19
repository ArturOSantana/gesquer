import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../hooks/use-toast';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export default function GerarQRLote() {
  const [quantidade, setQuantidade] = useState(10);
  const [prefixo, setPrefixo] = useState('QUERMESSE');
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);

  async function gerarLote() {
    if (quantidade < 1 || quantidade > 1000) {
      toast({
        title: 'Erro',
        description: 'Quantidade deve ser entre 1 e 1000',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const novosQRs = [];

    try {
      for (let i = 0; i < quantidade; i++) {
        const id = uuidv4();
        const qrData = `${prefixo}-${id}`;
        
        // Gerar imagem do QR Code
        const qrImage = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H'
        });

        novosQRs.push({
          id: qrData,
          image: qrImage,
          numero: i + 1
        });
      }

      setQrCodes(novosQRs);
      toast({
        title: 'Sucesso',
        description: `${quantidade} QR Codes gerados!`
      });
    } catch (error) {
      console.error('Erro ao gerar QR Codes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar QR Codes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function imprimirTodos() {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${prefixo}</title>
        <style>
          @media print {
            @page { margin: 10mm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10mm;
            padding: 10mm;
          }
          .qr-card {
            border: 2px solid #000;
            padding: 5mm;
            text-align: center;
            page-break-inside: avoid;
          }
          .qr-card img {
            width: 100%;
            max-width: 60mm;
          }
          .qr-card h3 {
            margin: 5mm 0 2mm 0;
            font-size: 14pt;
          }
          .qr-card p {
            margin: 0;
            font-size: 10pt;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${qrCodes.map(qr => `
          <div class="qr-card">
            <h3>Cartão #${qr.numero}</h3>
            <img src="${qr.image}" alt="QR Code ${qr.numero}" />
            <p>${qr.id}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }

  function baixarPDF() {
    // Implementar download como PDF usando jsPDF
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de PDF em desenvolvimento'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Gerar QR Codes em Lote</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Quantidade de QR Codes
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg"
              />
              <p className="text-sm text-gray-600 mt-1">
                Máximo: 1.000 por lote
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Prefixo (opcional)
              </label>
              <input
                type="text"
                value={prefixo}
                onChange={(e) => setPrefixo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg"
                placeholder="QUERMESSE"
              />
              <p className="text-sm text-gray-600 mt-1">
                Identificação do evento
              </p>
            </div>
          </div>

          <button
            onClick={gerarLote}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : `Gerar ${quantidade} QR Codes`}
          </button>
        </div>

        {qrCodes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {qrCodes.length} QR Codes Gerados
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={imprimirTodos}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Imprimir Todos
                </button>
                <button
                  onClick={baixarPDF}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                >
                  Baixar PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="border-2 border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold mb-2">#{qr.numero}</p>
                  <img src={qr.image} alt={`QR ${qr.numero}`} className="w-full" />
                  <p className="text-xs text-gray-600 mt-2 break-all">
                    {qr.id.substring(0, 20)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
