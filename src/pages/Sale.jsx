import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from '@/components/qr/QrScanner';
import { SaleForm } from '@/components/sales/SaleForm';
import { SaleCart } from '@/components/sales/SaleCart';
import { SaleConfirmation } from '@/components/sales/SaleConfirmation';
import { SaleReceipt } from '@/components/sales/SaleReceipt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useBarracas } from '@/hooks/useBarracas';
import { useProducts } from '@/hooks/useProducts';
import { useCards } from '@/hooks/useCards';
import { useTransactions } from '@/hooks/useTransactions';
import { useSaleIdempotency } from '@/hooks/useSaleIdempotency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, QrCode, AlertCircle, CreditCard, Store, Plus, Minus, Package } from 'lucide-react';

/**
 * Página de vendas
 */
export default function Sale() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isBarraca } = useAuth();
  
  // Hooks
  const { barracas, loading: barracasLoading } = useBarracas();
  const { getCardByUuid } = useCards();
  const { processSale } = useTransactions();
  const { idempotencyKey, processing: idempotencyProcessing, startProcessing, generateNewKey } = useSaleIdempotency();
  
  // Estados principais
  const [step, setStep] = useState('select-barraca'); // select-barraca, scan-card, add-items, confirm, receipt
  const [selectedBarraca, setSelectedBarraca] = useState(null);
  const [scannedCard, setScannedCard] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({}); // Quantidades por produto
  const [saleResult, setSaleResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Hook de produtos (carrega quando barraca é selecionada)
  const { products, loading: productsLoading } = useProducts(selectedBarraca?.id);

  // Define barraca fixa para operador de barraca
  useEffect(() => {
    console.log('Sale.jsx - useEffect barraca:', {
      isBarraca,
      profile,
      barraca_id: profile?.barraca_id,
      barracas_count: barracas.length
    });

    if (!isBarraca) return;

    if (!profile?.barraca_id) {
      console.log('Sale.jsx - Operador de barraca sem barraca_id no profile');
      setSelectedBarraca(null);
      setStep('select-barraca');
      return;
    }

    const barracaDoOperador = barracas.find(
      (barraca) => barraca.id === profile.barraca_id
    );

    console.log('Sale.jsx - Barraca encontrada:', barracaDoOperador);
    setSelectedBarraca(barracaDoOperador || null);
    setStep(barracaDoOperador ? 'scan-card' : 'select-barraca');
  }, [isBarraca, profile?.barraca_id, barracas]);

  // Reseta ao mudar de barraca
  useEffect(() => {
    if (selectedBarraca) {
      setScannedCard(null);
      setCartItems([]);
      setQuantities({});
      setError(null);
    }
  }, [selectedBarraca]);

  // Inicializa quantities quando produtos são carregados
  useEffect(() => {
    if (products && products.length > 0) {
      const initialQuantities = {};
      products.forEach(product => {
        initialQuantities[product.id] = 0;
      });
      setQuantities(initialQuantities);
    }
  }, [products]);

  // Seleciona barraca
  const handleBarracaSelect = (barraca) => {
    if (isBarraca) return;

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

  // Atualiza quantidade de um produto
  const updateQuantity = (productId, delta) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return {
        ...prev,
        [productId]: newQty
      };
    });
  };

  // Define quantidade diretamente
  const setQuantity = (productId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  // Limpa todas as quantidades
  const clearQuantities = () => {
    const resetQuantities = {};
    products.forEach(product => {
      resetQuantities[product.id] = 0;
    });
    setQuantities(resetQuantities);
    
    toast({
      title: 'Quantidades zeradas',
      description: 'Todas as quantidades foram resetadas.',
    });
  };

  // Vai para confirmação
  const handleCheckout = () => {
    if (!selectedBarraca?.id) {
      toast({
        title: 'Barraca inválida',
        description: 'Selecione ou vincule uma barraca válida antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (isBarraca && profile?.barraca_id !== selectedBarraca.id) {
      toast({
        title: 'Barraca não permitida',
        description: 'Operador de barraca só pode cobrar na barraca vinculada ao seu usuário.',
        variant: 'destructive',
      });
      return;
    }

    // Monta carrinho a partir das quantidades
    const items = products
      .filter(product => quantities[product.id] > 0)
      .map(product => ({
        product_id: product.id,
        name: product.name,
        quantity: quantities[product.id],
        unit_price: product.price
      }));

    if (items.length === 0) {
      toast({
        title: 'Nenhum produto selecionado',
        description: 'Adicione pelo menos um produto antes de finalizar.',
        variant: 'destructive',
      });
      return;
    }

    setCartItems(items);
    setStep('confirm');
  };

  // Confirma venda
  const handleConfirmSale = async () => {
    // Previne cliques duplos
    if (!startProcessing()) {
      toast({
        title: 'Aguarde',
        description: 'A venda já está sendo processada.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (!selectedBarraca?.id) {
        throw new Error('Nenhuma barraca válida vinculada para realizar a cobrança');
      }

      if (isBarraca && profile?.barraca_id !== selectedBarraca.id) {
        throw new Error('Operador de barraca só pode cobrar na barraca vinculada ao seu usuário');
      }

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

      console.log('Processando venda com idempotency_key:', idempotencyKey);

      // Processa venda
      const result = await processSale(saleData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Salva resultado
      setSaleResult(result);
      setStep('receipt');

      // Gera nova chave para próxima venda
      generateNewKey();

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
    clearQuantities();
    setSaleResult(null);
    setError(null);
    generateNewKey(); // Nova chave de idempotência
    setStep(selectedBarraca?.id ? 'scan-card' : 'select-barraca');
  };

  // Volta para home
  const handleGoHome = () => {
    navigate('/');
  };

  // Calcula total baseado nas quantidades
  const calculateTotal = () => {
    if (!products || products.length === 0) return 0;
    
    return products.reduce((sum, product) => {
      const qty = quantities[product.id] || 0;
      return sum + (qty * product.price);
    }, 0);
  };

  // Calcula total de itens
  const calculateTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const total = step === 'confirm' || step === 'receipt'
    ? cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    : calculateTotal();

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Realizar Venda</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Sistema de vendas com cartão pré-pago
          </p>
        </div>
      </div>

      {/* Progresso - Mobile Friendly */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            <div className={`flex items-center gap-1 sm:gap-2 flex-shrink-0 ${step === 'select-barraca' ? 'text-primary' : step !== 'select-barraca' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${step === 'select-barraca' ? 'bg-primary text-primary-foreground' : step !== 'select-barraca' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Barraca</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-1 sm:mx-2 min-w-[20px]" />
            <div className={`flex items-center gap-1 sm:gap-2 flex-shrink-0 ${step === 'scan-card' ? 'text-primary' : ['add-items', 'confirm', 'receipt'].includes(step) ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${step === 'scan-card' ? 'bg-primary text-primary-foreground' : ['add-items', 'confirm', 'receipt'].includes(step) ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Cartão</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-1 sm:mx-2 min-w-[20px]" />
            <div className={`flex items-center gap-1 sm:gap-2 flex-shrink-0 ${step === 'add-items' ? 'text-primary' : ['confirm', 'receipt'].includes(step) ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${step === 'add-items' ? 'bg-primary text-primary-foreground' : ['confirm', 'receipt'].includes(step) ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Produtos</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-1 sm:mx-2 min-w-[20px]" />
            <div className={`flex items-center gap-1 sm:gap-2 flex-shrink-0 ${step === 'confirm' ? 'text-primary' : step === 'receipt' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-base ${step === 'confirm' ? 'bg-primary text-primary-foreground' : step === 'receipt' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                4
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Confirmar</span>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Conteúdo baseado no step */}
        {step === 'select-barraca' && (
          isBarraca ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!profile?.barraca_id
                  ? 'Seu usuário de barraca não possui barraca vinculada. Não é possível realizar cobranças.'
                  : barracasLoading
                    ? 'Carregando dados da barraca vinculada...'
                    : 'A barraca vinculada ao seu usuário não foi encontrada ou não está disponível.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Seleção de Barraca
                  </CardTitle>
                  <CardDescription>
                    Escolha a barraca para iniciar a venda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Barraca selecionável para perfis administrativos.</p>
                    <select
                      value={selectedBarraca?.id || ''}
                      onChange={(e) => {
                        const barraca = barracas.find(item => item.id === parseInt(e.target.value, 10));
                        handleBarracaSelect(barraca || null);
                      }}
                      disabled={barracasLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {barracasLoading ? 'Carregando barracas...' : 'Selecione uma barraca'}
                      </option>
                      {barracas
                        .filter((barraca) => barraca.status === 'active')
                        .map((barraca) => (
                          <option key={barraca.id} value={barraca.id}>
                            {barraca.name}
                            {barraca.responsible ? ` - ${barraca.responsible}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        )}

        {step === 'scan-card' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                <CardTitle>{isBarraca ? 'Barraca Vinculada' : 'Barraca Selecionada'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Barraca:</p>
                  <p className="font-semibold text-lg">{selectedBarraca?.name}</p>
                  {selectedBarraca?.description && (
                    <p className="text-muted-foreground">{selectedBarraca.description}</p>
                  )}
                  {selectedBarraca?.responsible && (
                    <p className="text-sm text-muted-foreground">
                      Responsável: {selectedBarraca.responsible}
                    </p>
                  )}
                  {isBarraca && (
                    <p className="text-sm text-primary font-medium">
                      Operando exclusivamente na barraca vinculada ao seu usuário.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'add-items' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Info do Cartão e Barraca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Cartão do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold text-base sm:text-lg">{scannedCard?.client?.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Cartão: {scannedCard?.uuid?.slice(0, 8)}...
                    </p>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Saldo Disponível:</span>
                        <span className="text-lg sm:text-xl font-bold text-green-600">
                          {formatCurrency(scannedCard?.balance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                    Barraca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-semibold text-base sm:text-lg">{selectedBarraca?.name}</p>
                    {selectedBarraca?.responsible && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Responsável: {selectedBarraca.responsible}
                      </p>
                    )}
                    {isBarraca && (
                      <p className="text-xs sm:text-sm text-primary font-medium pt-2">
                        ✓ Barraca fixa do operador
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Produtos com Quantidades */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos da Barraca
                  </CardTitle>
                  {calculateTotalItems() > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearQuantities}
                      className="text-xs"
                    >
                      Limpar Tudo
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Selecione as quantidades dos produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando produtos...
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map(product => {
                      const qty = quantities[product.id] || 0;
                      const subtotal = qty * product.price;
                      
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-colors ${
                            qty > 0 ? 'bg-primary/5 border-primary/30' : 'bg-card'
                          }`}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-semibold text-sm sm:text-base truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {formatCurrency(product.price)} / unidade
                              </p>
                              {product.stock_quantity !== null && (
                                <p className="text-xs text-muted-foreground">
                                  • Estoque: {product.stock_quantity}
                                </p>
                              )}
                            </div>
                            {qty > 0 && (
                              <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                                Subtotal: {formatCurrency(subtotal)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(product.id, -1)}
                              disabled={qty === 0}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>

                            <div className="w-12 sm:w-16 text-center">
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => setQuantity(product.id, e.target.value)}
                                className="w-full text-center font-bold text-base sm:text-lg border rounded px-1 py-1"
                              />
                            </div>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(product.id, 1)}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum produto cadastrado para esta barraca.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Resumo e Botão de Finalizar */}
            <Card className="sticky bottom-4 shadow-lg">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-muted-foreground">Total de Itens:</span>
                    <span className="font-semibold text-lg">
                      {calculateTotalItems()} {calculateTotalItems() === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-semibold text-base sm:text-lg">Total a Pagar:</span>
                    <span className="font-bold text-xl sm:text-2xl text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>

                  {calculateTotal() > (scannedCard?.balance || 0) && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Saldo insuficiente! Faltam {formatCurrency(calculateTotal() - (scannedCard?.balance || 0))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleCheckout}
                    disabled={calculateTotalItems() === 0 || processing}
                    className="w-full py-6 text-base sm:text-lg font-semibold"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Continuar para Confirmação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'confirm' && (
          <div className="w-full max-w-2xl mx-auto">
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
          <div className="w-full max-w-2xl mx-auto">
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

