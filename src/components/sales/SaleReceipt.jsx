import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Download, Printer, Home } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/**
 * Componente de recibo de venda
 */
export function SaleReceipt({ 
  sale,
  card, 
  barraca, 
  items, 
  total,
  newBalance,
  onNewSale,
  onGoHome
}) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Gera texto do recibo
    const receiptText = `
RECIBO DE VENDA
=====================================

Data: ${new Date(sale?.created_at || Date.now()).toLocaleString('pt-BR')}
Venda #${sale?.id || 'N/A'}

-------------------------------------
BARRACA
-------------------------------------
${barraca?.name}
${barraca?.responsible ? `Responsável: ${barraca.responsible}` : ''}

-------------------------------------
CARTÃO
-------------------------------------
Cliente: ${card?.client?.name}
Cartão: ${card?.uuid}

-------------------------------------
ITENS
-------------------------------------
${items.map(item => 
  `${item.quantity}x ${item.name}\n   ${formatCurrency(item.unit_price)} cada = ${formatCurrency(item.quantity * item.unit_price)}`
).join('\n')}

-------------------------------------
RESUMO
-------------------------------------
Total: ${formatCurrency(total)}
Saldo Anterior: ${formatCurrency((card?.balance || 0) + total)}
Saldo Atual: ${formatCurrency(newBalance)}

=====================================
Obrigado pela preferência!
    `.trim();

    // Cria blob e faz download
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-venda-${sale?.id || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="print:shadow-none">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Venda Realizada com Sucesso!</CardTitle>
        <CardDescription>
          {new Date(sale?.created_at || Date.now()).toLocaleString('pt-BR')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações da Venda */}
        <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-muted-foreground mb-1">Venda</p>
          <p className="text-3xl font-bold text-green-600">
            #{sale?.id || 'N/A'}
          </p>
        </div>

        {/* Barraca */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">BARRACA</h3>
          <div className="p-3 rounded-lg border bg-card">
            <p className="font-medium">{barraca?.name}</p>
            {barraca?.responsible && (
              <p className="text-sm text-muted-foreground">
                Responsável: {barraca.responsible}
              </p>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">CLIENTE</h3>
          <div className="p-3 rounded-lg border bg-card">
            <p className="font-medium">{card?.client?.name}</p>
            <p className="text-sm text-muted-foreground">
              Cartão: {card?.uuid?.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Itens */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">ITENS</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(item.quantity * item.unit_price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-3 p-4 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pago:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Anterior:</span>
              <span>{formatCurrency((card?.balance || 0) + total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor da Compra:</span>
              <span className="text-red-600">- {formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Saldo Atual:</span>
              <span className="text-green-600">{formatCurrency(newBalance)}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <Badge variant="default" className="text-base px-4 py-2">
            Pagamento Confirmado
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 print:hidden">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button
            onClick={onNewSale}
            className="flex-1"
          >
            Nova Venda
          </Button>
          <Button
            variant="outline"
            onClick={onGoHome}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Made with Bob
