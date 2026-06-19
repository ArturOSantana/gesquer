import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from '@/components/qr/QrScanner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { useCards } from '@/hooks/useCards';
import { useTransactions } from '@/hooks/useTransactions';
import { useSaleIdempotency } from '@/hooks/useSaleIdempotency';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, ArrowLeft, Check, X } from 'lucide-react';

/**
 * Componente de Card de Produto - Otimizado para Mobile
 */
function ProductCard({ product, quantity, onIncrement, onDecrement, onSetQuantity }) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleInputSubmit = () => {
    const qty = parseInt(inputValue, 10);
    if (!isNaN(qty) && qty >= 0) {
      onSetQuantity(qty);
    }
    setShowInput(false);
    setInputValue('');
  };

  const subtotal = quantity * product.price;

  return (
    <>
      <div className={`
        bg-white rounded-lg border-2 p-4 transition-all
        ${quantity > 0 ? 'border-blue-500 shadow-md' : 'border-gray-200'}
      `}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-xl text-green-600 font-semibold">
              {formatCurrency(product.price)}
            </p>
            {product.stock_quantity !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Estoque: {product.stock_quantity}
              </p>
            )}
          </div>
          
          {quantity > 0 && (
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
              {quantity}x
            </div>
          )}
        </div>

        {/* Controles de quantidade */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrement}
            disabled={quantity === 0}
            className="flex-1 h-14 bg-red-100 text-red-600 rounded-lg font-bold text-2xl hover:bg-red-200 active:bg-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>

          <button
            onClick={() => setShowInput(true)}
            className="flex-1 h-14 bg-gray-100 rounded-lg font-bold text-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            {quantity || '0'}
          </button>

          <button
            onClick={onIncrement}
            className="flex-1 h-14 bg-green-100 text-green-600 rounded-lg font-bold text-2xl hover:bg-green-200 active:bg-green-300 transition-colors"
          >
            +
          </button>
        </div>

        {/* Subtotal */}
        {quantity > 0 && (
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(subtotal)}
            </span>
          </div>
        )}
      </div>

      {/* Input modal para quantidade */}
      {showInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Quantidade de {product.name}</h3>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              placeholder="Digite a quantidade"
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl text-center font-bold focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowInput(false);
                  setInputValue('');
                }}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleInputSubmit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Componente de Scanner QR
 */
function QrScannerStep({ onScan, onBack }) {
  const [error, setError] = useState(null);

  const handleScan = (data) => {
    setError(null);
    onScan(data);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 font-semibold"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </button>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Escaneie o Cartão do Cliente</h2>
        <p className="text-gray-600 mb-6">
          Aponte a câmera para o QR Code do cartão
        </p>
        
        <QrScanner onScan={handleScan} />
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de Confirmação
 */
function ConfirmationStep({ cart, products, total, scannedCard, onConfirm, onCancel, loading }) {
  const items = products
    .filter(p => cart[p.id] > 0)
    .map(p => ({
      name: p.name,
      quantity: cart[p.id],
      unit_price: p.price,
      subtotal: cart[p.id] * p.price
    }));

  const hasInsufficientBalance = total > (scannedCard?.balance || 0);

  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-blue-600 font-semibold"
        disabled={loading}
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </button>

      <div className="bg-white rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-bold">Confirmar Venda</h2>

        {/* Info do Cliente */}
        <div className="border-b pb-4">
          <p className="text-sm text-gray-600 mb-1">Cliente</p>
          <p className="font-bold text-lg">{scannedCard?.client?.name}</p>
          <p className="text-sm text-gray-500">
            Cartão: {scannedCard?.uuid?.slice(0, 8)}...
          </p>
        </div>

        {/* Saldo */}
        <div className="border-b pb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Saldo Atual:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(scannedCard?.balance || 0)}
            </span>
          </div>
        </div>

        {/* Itens */}
        <div className="space-y-2">
          <p className="font-semibold text-gray-700">Itens da Venda:</p>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity}x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Saldo após venda:</span>
            <span className={`font-semibold ${hasInsufficientBalance ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency((scannedCard?.balance || 0) - total)}
            </span>
          </div>
        </div>

        {/* Alerta de saldo insuficiente */}
        {hasInsufficientBalance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Saldo insuficiente! Faltam {formatCurrency(total - (scannedCard?.balance || 0))}
            </AlertDescription>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-4 border-2 border-gray-300 rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            <X className="inline h-5 w-5 mr-2" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || hasInsufficientBalance}
            className="flex-[2] py-4 bg-green-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Processando...'
            ) : (
              <>
                <Check className="inline h-5 w-5 mr-2" />
                Confirmar Venda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Página de Vendas - Mobile First
 */
export default function Sale() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isBarraca } = useAuth();
  
  // Hooks
  const { getCardByUuid } = useCards();
  const { processSale } = useTransactions();
  const { idempotencyKey, startProcessing, generateNewKey } = useSaleIdempotency();
  
  // Estados
  const [step, setStep] = useState('select'); // 'select' | 'scan' | 'confirm' | 'success'
  const [cart, setCart] = useState({});
  const [scannedCard, setScannedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saleResult, setSaleResult] = useState(null);

  // Carrega produtos da barraca do operador
  const { products, loading: productsLoading } = useProducts(profile?.barraca_id);

  // Carrega produtos automaticamente
  useEffect(() => {
    if (!profile?.barraca_id) {
      toast({
        title: 'Erro',
        description: 'Operador sem barraca vinculada',
        variant: 'destructive',
      });
    }
  }, [profile?.barraca_id, toast]);

  // Atualiza quantidade no carrinho
  function updateCart(productId, delta) {
    setCart(prev => {
      const current = prev[productId] || 0;
      const newQty = Math.max(0, current + delta);
      
      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [productId]: newQty };
    });
  }

  // Define quantidade diretamente
  function setCartQuantity(productId, qty) {
    if (qty === 0) {
      const { [productId]: _, ...rest } = cart;
      setCart(rest);
    } else {
      setCart(prev => ({ ...prev, [productId]: qty }));
    }
  }

  // Calcula total
  const total = products.reduce((sum, p) => 
    sum + (p.price * (cart[p.id] || 0)), 0
  );
  
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Processa QR Code escaneado
  const handleQrScan = async (qrData) => {
    try {
      setLoading(true);
      
      // Extrai UUID do QR Code
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
      setStep('confirm');
      
      toast({
        title: 'Cartão identificado!',
        description: `Cliente: ${card.client.name}`,
      });
    } catch (err) {
      toast({
        title: 'Erro ao escanear',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirma venda
  const handleConfirmSale = async () => {
    if (!startProcessing()) {
      toast({
        title: 'Aguarde',
        description: 'A venda já está sendo processada.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Prepara itens
      const items = products
        .filter(p => cart[p.id] > 0)
        .map(p => ({
          product_id: p.id,
          quantity: cart[p.id],
          unit_price: p.price
        }));

      // Processa venda
      const result = await processSale({
        card_id: scannedCard.id,
        barraca_id: profile.barraca_id,
        items
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSaleResult(result);
      setStep('success');
      generateNewKey();

      toast({
        title: 'Venda realizada!',
        description: 'A venda foi processada com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao processar venda',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Nova venda
  const handleNewSale = () => {
    setCart({});
    setScannedCard(null);
    setSaleResult(null);
    setStep('select');
    generateNewKey();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Nova Venda</h1>
          <p className="text-sm text-gray-600">
            {step === 'select' && 'Selecione os produtos'}
            {step === 'scan' && 'Escaneie o cartão do cliente'}
            {step === 'confirm' && 'Confirme a venda'}
            {step === 'success' && 'Venda concluída!'}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {step === 'select' && (
          <div className="space-y-3">
            {productsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Carregando produtos...</p>
              </div>
            ) : products && products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            ) : (
              products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cart[product.id] || 0}
                  onIncrement={() => updateCart(product.id, 1)}
                  onDecrement={() => updateCart(product.id, -1)}
                  onSetQuantity={(qty) => setCartQuantity(product.id, qty)}
                />
              ))
            )}
          </div>
        )}

        {step === 'scan' && (
          <QrScannerStep
            onScan={handleQrScan}
            onBack={() => setStep('select')}
          />
        )}

        {step === 'confirm' && (
          <ConfirmationStep
            cart={cart}
            products={products}
            total={total}
            scannedCard={scannedCard}
            onConfirm={handleConfirmSale}
            onCancel={() => setStep('scan')}
            loading={loading}
          />
        )}

        {step === 'success' && saleResult && (
          <div className="bg-white rounded-lg p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Venda Realizada!
              </h2>
              <p className="text-gray-600">
                A venda foi processada com sucesso
              </p>
            </div>

            <div className="border-t border-b py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total da venda:</span>
                <span className="font-bold text-lg">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Novo saldo:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(saleResult.new_balance)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleNewSale}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg"
              >
                Nova Venda
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 border-2 border-gray-300 rounded-lg font-semibold text-lg"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer fixo com resumo e ação */}
      {step === 'select' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="p-4 space-y-3">
            {/* Resumo */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <button
                onClick={() => setCart({})}
                disabled={totalItems === 0}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold disabled:opacity-30"
              >
                Limpar
              </button>
              <button
                onClick={() => setStep('scan')}
                disabled={totalItems === 0}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
