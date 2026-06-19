import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarracaSelector } from '@/components/barracas/BarracaSelector';
import QrScanner from '@/components/qr/QrScanner';
import { SaleForm } from '@/components/sales/SaleForm';
import { SaleCart } from '@/components/sales/SaleCart';
import { SaleConfirmation } from '@/components/sales/SaleConfirmation';
import { SaleReceipt } from '@/components/sales/SaleReceipt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBarracas } from '@/hooks/useBarracas';
import { useProducts } from '@/hooks/useProducts';
import { useCards } from '@/hooks/useCards';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, QrCode, AlertCircle, CreditCard } from 'lucide-react';

/**
 * Página de vendas
 */
export default function Sale() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hooks
  const { barracas, loading: barracasLoading } = useBarracas();
  const { getCardByUuid } = useCards();
  const { processSale } = useTransactions();
  
  // Estados principais
  const [step, setStep] = useState('select-barraca'); // select-barraca, scan-card, add-items, confirm, receipt
  const [selectedBarraca, setSelectedBarraca] = useState(null);
  const [scannedCard, setScannedCard] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [saleResult, setSaleResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Hook de produtos (carrega quando barraca é selecionada)
  const { products, loading: productsLoading } = useProducts(selectedBarraca?.id);

  // Reseta ao mudar de barraca
  useEffect(() => {
    if (selectedBarraca) {
      setScannedCard(null);
      setCartItems([]);
      setError(null);
    }
  }, [selectedBarraca]);

  // Seleciona barraca
  const handleBarracaSelect = (barraca) => {
    setSelectedBarraca(barraca);
    if (barraca) {
      setStep('scan-card');
    }
  };

  // Processa QR Code escaneado
  const handleQrScan = async (qrData) => {
    try {
      setError(null);
      
      // Extrai UUID do QR Code (formato: QUERMESSEON:{uuid})
      const uuid = qrData.replace('QUERMESSEON:', '').trim();
      
      // Busca cartão
      const { data: card, error: cardError } = await getCardByUuid(uuid);
      
      if (cardError || !card) {
        throw new Error('Cartão não encontrado');
      }

      if (card.status !== 'active') {
        throw new Error('Cartão não está ativo');
      }

      setScannedCard(card);
      setStep('add-items');
      
      toast({
        title: 'Cartão identificado!',
        description: `Cliente: ${card.client.name}`,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Erro ao escanear',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Adiciona item ao carrinho
  const handleAddToCart = (item) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.product_id === item.product_id);
      
      if (existingItem) {
        // Atualiza quantidade
        return prev.map(i =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Adiciona novo item
        return [...prev, item];
      }
    });

    toast({
      title: 'Item adicionado!',
      description: `${item.quantity}x ${item.name}`,
    });
  };

  // Atualiza quantidade de item
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item do carrinho
  const handleRemoveItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.product_id !== productId));
    
    toast({
      title: 'Item removido',
      description: 'O item foi removido do carrinho.',
    });
  };

  // Limpa carrinho
  const handleClearCart = () => {
    setCartItems([]);
    
    toast({
      title: 'Carrinho limpo',
      description: 'Todos os itens foram removidos.',
    });
  };

  // Vai para confirmação
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens antes de finalizar.',
        variant: 'destructive',
      });
      return;
    }
    
    setStep('confirm');
  };

  // Confirma venda
  const handleConfirmSale = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Prepara dados da venda
      const saleData = {
        card_id: scannedCard.id,
        barraca_id: selectedBarraca.id,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      // Processa venda
      const result = await processSale(saleData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Salva resultado
      setSaleResult(result);
      setStep('receipt');

      toast({
        title: 'Venda realizada!',
        description: 'A venda foi processada com sucesso.',
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Erro ao processar venda',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancela confirmação
  const handleCancelConfirmation = () => {
    setStep('add-items');
  };

  // Nova venda
  const handleNewSale = () => {
    setScannedCard(null);
    setCartItems([]);
    setSaleResult(null);
    setError(null);
    setStep('scan-card');
  };

  // Volta para home
  const handleGoHome = () => {
    navigate('/');
  };

  // Calcula total
  const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Realizar Venda</h1>
              <p className="text-muted-foreground">
                Sistema de vendas com cartão pré-pago
              </p>
            </div>
          </div>
        </div>

        {/* Progresso */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${step === 'select-barraca' ? 'text-primary' : step !== 'select-barraca' ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select-barraca' ? 'bg-primary text-primary-foreground' : step !== 'select-barraca' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                  1
                </div>
                <span className="font-medium">Barraca</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted mx-2" />
              <div className={`flex items-center gap-2 ${step === 'scan-card' ? 'text-primary' : ['add-items', 'confirm', 'receipt'].includes(step) ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'scan-card' ? 'bg-primary text-primary-foreground' : ['add-items', 'confirm', 'receipt'].includes(step) ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                  2
                </div>
                <span className="font-medium">Cartão</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted mx-2" />
              <div className={`flex items-center gap-2 ${step === 'add-items' ? 'text-primary' : ['confirm', 'receipt'].includes(step) ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'add-items' ? 'bg-primary text-primary-foreground' : ['confirm', 'receipt'].includes(step) ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                  3
                </div>
                <span className="font-medium">Produtos</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted mx-2" />
              <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-primary' : step === 'receipt' ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-primary text-primary-foreground' : step === 'receipt' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                  4
                </div>
                <span className="font-medium">Confirmar</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo baseado no step */}
        {step === 'select-barraca' && (
          <BarracaSelector
            value={selectedBarraca}
            onChange={handleBarracaSelect}
            barracas={barracas}
            loading={barracasLoading}
            required
            label="Selecione a Barraca"
            placeholder="Escolha a barraca para realizar a venda"
          />
        )}

        {step === 'scan-card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Escanear Cartão
                </CardTitle>
                <CardDescription>
                  Aponte a câmera para o QR Code do cartão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QrScanner onScan={handleQrScan} />
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Barraca Selecionada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{selectedBarraca?.name}</p>
                  {selectedBarraca?.description && (
                    <p className="text-muted-foreground">{selectedBarraca.description}</p>
                  )}
                  {selectedBarraca?.responsible && (
                    <p className="text-sm text-muted-foreground">
                      Responsável: {selectedBarraca.responsible}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'add-items' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Info do Cartão */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Cartão Identificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">{scannedCard?.client?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cartão: {scannedCard?.uuid?.slice(0, 8)}...
                    </p>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Saldo:</span>
                        <span className="text-xl font-bold text-green-600">
                          R$ {scannedCard?.balance?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulário de Produtos */}
              <SaleForm
                products={products}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
              />
            </div>

            {/* Carrinho */}
            <SaleCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClear={handleClearCart}
              onCheckout={handleCheckout}
            />
          </div>
        )}

        {step === 'confirm' && (
          <div className="max-w-2xl mx-auto">
            <SaleConfirmation
              card={scannedCard}
              barraca={selectedBarraca}
              items={cartItems}
              total={total}
              onConfirm={handleConfirmSale}
              onCancel={handleCancelConfirmation}
              loading={processing}
              error={error}
            />
          </div>
        )}

        {step === 'receipt' && saleResult && (
          <div className="max-w-2xl mx-auto">
            <SaleReceipt
              sale={{ id: saleResult.sale_id, created_at: new Date() }}
              card={scannedCard}
              barraca={selectedBarraca}
              items={cartItems}
              total={total}
              newBalance={saleResult.new_balance}
              onNewSale={handleNewSale}
              onGoHome={handleGoHome}
            />
          </div>
      )}
    </div>
  );
}

// Made with Bob
