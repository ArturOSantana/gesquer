import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Printer, RefreshCcw, UserRound, QrCode } from 'lucide-react';
import { useBatch } from '../../hooks/useBatch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function getBatchStatusLabel(status) {
  const labels = {
    active: 'Ativo',
    used: 'Utilizado',
    cancelled: 'Cancelado',
  };

  return labels[status] || status;
}

function getCardStatusBadgeClass(status) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-700',
    blocked: 'bg-red-100 text-red-700',
  };

  return styles[status] || 'bg-gray-100 text-gray-700';
}

export default function BatchDetails() {
  const { id } = useParams();
  const { loading, error, getBatchDetails, exportBatchCSV, printBatch } = useBatch();

  const [batch, setBatch] = useState(null);
  const [cards, setCards] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);

  useEffect(() => {
    loadBatchDetails();
  }, [id]);

  useEffect(() => {
    generateQrCodes();
  }, [cards]);

  const loadBatchDetails = async () => {
    const result = await getBatchDetails(id);

    if (result.success) {
      setBatch(result.batch);
      setCards(result.cards);
    }
  };

  const generateQrCodes = async () => {
    if (!cards.length) {
      setQrCodes([]);
      return;
    }

    const generated = await Promise.all(
      cards.map(async (card) => {
        const qrCodeUrl = await QRCode.toDataURL(card.qr_value, {
          width: 220,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        return {
          ...card,
          qrCodeUrl,
        };
      })
    );

    setQrCodes(generated);
  };

  const summary = useMemo(() => ({
    total: cards.length,
    bound: cards.filter((card) => card.is_bound).length,
    pending: cards.filter((card) => card.status === 'pending').length,
    inactive: cards.filter((card) => card.status === 'inactive').length,
  }), [cards]);

  const handleDownloadCSV = () => {
    if (batch && cards.length > 0) {
      exportBatchCSV(batch, cards);
    }
  };

  const handlePrint = () => {
    if (batch) {
      printBatch(batch);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="space-y-1">
          <Button asChild variant="ghost" className="mb-2 w-fit gap-2 px-0">
            <Link to="/admin/batches">
              <ArrowLeft className="h-4 w-4" />
              Voltar para lotes
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {batch ? `Lote #${batch.id}` : 'Detalhes do Lote'}
          </h1>
          <p className="text-gray-600">
            Visualização completa dos QR Codes e códigos UUID do lote.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadBatchDetails} disabled={loading} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV} disabled={!batch || cards.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar CSV
          </Button>
          <Button onClick={handlePrint} disabled={!batch || qrCodes.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Lote
          </Button>
        </div>
      </div>

      {loading && !batch ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            Carregando detalhes do lote...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : !batch ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            Lote não encontrado.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>{batch.batch_code}</CardTitle>
              <CardDescription>
                Status do lote: {getBatchStatusLabel(batch.status)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <span className="text-sm text-gray-500">Criado em</span>
                <p className="font-medium">{formatDateTime(batch.created_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Criado por</span>
                <p className="font-medium">{batch.creator_name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Quantidade</span>
                <p className="font-medium">{batch.quantity} cartões</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Descrição</span>
                <p className="font-medium">{batch.description || 'Sem descrição'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle>{summary.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vinculados</CardDescription>
                <CardTitle>{summary.bound}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Não vinculados</CardDescription>
                <CardTitle>{summary.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Inativos</CardDescription>
                <CardTitle>{summary.inactive}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Codes do Lote
              </CardTitle>
              <CardDescription>
                Todos os cartões do lote prontos para visualização e reimpressão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qrCodes.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  Nenhum cartão encontrado neste lote.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5 print:grid-cols-4 print:gap-3">
                  {qrCodes.map((card, index) => (
                    <div
                      key={card.id}
                      className="rounded-lg border p-3 text-center print:break-inside-avoid print:border-gray-300"
                    >
                      <div className="mb-2 text-xs text-gray-500">#{index + 1}</div>
                      <img
                        src={card.qrCodeUrl}
                        alt={`QR Code ${card.uuid}`}
                        className="mx-auto h-32 w-32 print:h-28 print:w-28"
                      />
                      <p className="mt-2 break-all font-mono text-[10px] text-gray-700">
                        {card.uuid}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${getCardStatusBadgeClass(card.status)}`}>
                        {card.binding_status_label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Lista de Códigos UUID</CardTitle>
              <CardDescription>
                Relação completa dos cartões com status de vínculo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-8 text-sm font-semibold text-gray-500">
                        {index + 1}.
                      </div>
                      <div>
                        <p className="break-all font-mono text-sm">{card.uuid}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Criado em {formatDateTime(card.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getCardStatusBadgeClass(card.status)}`}>
                        {card.binding_status_label}
                      </span>
                      {card.client_name && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          <UserRound className="h-3 w-3" />
                          {card.client_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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