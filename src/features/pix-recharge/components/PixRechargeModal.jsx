/**
 * Modal para recarga via PIX
 * Gerencia todo o fluxo: valor, dados do cliente, QR code e confirmação
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePixPayment, PIX_STATUS } from '../hooks/usePixPayment';
import { formatCurrency, isValidCPF, formatCPF } from '../api/woovi';

const PRESET_VALUES = [500, 1000, 2000, 5000, 10000]; // Em centavos

export function PixRechargeModal({ isOpen, onClose, cardUuid, cardNumber, currentBalance }) {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [step, setStep] = useState('amount'); // amount, customer, qrcode, result
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Hook de pagamento PIX
  const {
    status,
    charge,
    error: pixError,
    loading,
    isCompleted,
    isExpired,
    isCancelled,
    hasError,
    pollingCount,
    createCharge,
    cancel,
    reset,
    getFeeInfo,
  } = usePixPayment({
    cardUuid,
    onSuccess: (data) => {
      setStep('result');
    },
    onError: (err) => {
      console.error('Erro no pagamento:', err);
    },
  });

  // Reseta ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setCustomerName('');
      setCustomerCpf('');
      setFormErrors({});
      reset();
    }
  }, [isOpen, reset]);

  // Valida valor
  const validateAmount = () => {
    const errors = {};
    const amountInCents = parseFloat(amount) * 100;

    if (!amount || amountInCents < 100) {
      errors.amount = 'Valor mínimo é R$ 1,00';
    }

    if (amountInCents > 100000) {
      errors.amount = 'Valor máximo é R$ 1.000,00';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Valida dados do cliente
  const validateCustomer = () => {
    const errors = {};

    if (!customerName || customerName.trim().length < 3) {
      errors.customerName = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (customerCpf && !isValidCPF(customerCpf)) {
      errors.customerCpf = 'CPF inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Avança para próximo passo
  const handleNextStep = () => {
    if (step === 'amount') {
      if (validateAmount()) {
        setStep('customer');
      }
    } else if (step === 'customer') {
      if (validateCustomer()) {
        handleCreateCharge();
      }
    }
  };

  // Cria cobrança PIX
  const handleCreateCharge = async () => {
    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      await createCharge({
        amount: amountInCents,
        customerName: customerName.trim(),
        customerTaxId: customerCpf ? customerCpf.replace(/\D/g, '') : undefined,
      });

      setStep('qrcode');
    } catch (err) {
      console.error('Erro ao criar cobrança:', err);
    }
  };

  // Cancela e fecha
  const handleCancel = async () => {
    if (status === PIX_STATUS.PENDING || status === PIX_STATUS.POLLING) {
      try {
        await cancel();
      } catch (err) {
        console.error('Erro ao cancelar:', err);
      }
    }
    onClose();
  };

  // Fecha após sucesso
  const handleClose = () => {
    if (isCompleted) {
      // Redireciona para consulta de saldo atualizado
      navigate(`/consultar-saldo/${cardUuid}`);
    }
    onClose();
  };

  // Calcula informações de taxa
  const feeInfo = amount ? getFeeInfo(Math.round(parseFloat(amount) * 100)) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Recarga via PIX
            {cardNumber && (
              <span className="text-sm font-normal text-muted-foreground">
                • Cartão {cardNumber}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'amount' && 'Escolha o valor da recarga'}
            {step === 'customer' && 'Informe seus dados'}
            {step === 'qrcode' && 'Escaneie o QR Code para pagar'}
            {step === 'result' && 'Resultado do pagamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* STEP 1: Valor */}
          {step === 'amount' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor da Recarga</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-sm text-red-500">{formErrors.amount}</p>
                )}
              </div>

              {/* Valores pré-definidos */}
              <div className="grid grid-cols-3 gap-2">
                {PRESET_VALUES.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    onClick={() => setAmount((value / 100).toFixed(2))}
                    className="h-12"
                  >
                    {formatCurrency(value)}
                  </Button>
                ))}
              </div>

              {/* Informações de taxa */}
              {feeInfo && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Valor bruto:</span>
                        <span className="font-semibold">
                          {formatCurrency(feeInfo.grossAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxa Woovi (0,99%):</span>
                        <span>-{formatCurrency(feeInfo.fee)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Valor líquido:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(feeInfo.netAmount)}
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continuar
                </Button>
              </div>
            </>
          )}

          {/* STEP 2: Dados do Cliente */}
          {step === 'customer' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome Completo *</Label>
                <Input
                  id="customerName"
                  placeholder="João da Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                {formErrors.customerName && (
                  <p className="text-sm text-red-500">{formErrors.customerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerCpf">CPF (opcional)</Label>
                <Input
                  id="customerCpf"
                  placeholder="000.000.000-00"
                  value={customerCpf}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    setCustomerCpf(formatted);
                  }}
                  maxLength={14}
                />
                {formErrors.customerCpf && (
                  <p className="text-sm text-red-500">{formErrors.customerCpf}</p>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Seus dados são usados apenas para identificação do pagamento e não são
                  armazenados permanentemente.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('amount')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar QR Code'
                  )}
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: QR Code */}
          {step === 'qrcode' && charge && (
            <>
              <div className="flex flex-col items-center space-y-4">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={charge.qrCodeImage}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>

                {/* Pix Copia e Cola */}
                <div className="w-full space-y-2">
                  <Label>PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input
                      value={charge.qrCodeText}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(charge.qrCodeText);
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <Alert>
                  <Clock className="h-4 w-4 animate-pulse" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Aguardando pagamento...</p>
                      <p className="text-sm text-muted-foreground">
                        Escaneie o QR Code ou copie o código PIX no seu app de banco.
                      </p>
                      {pollingCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Verificando... ({pollingCount})
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Valor */}
                <div className="w-full p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor a pagar:</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(charge.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancelar Pagamento
              </Button>
            </>
          )}

          {/* STEP 4: Resultado */}
          {step === 'result' && (
            <>
              {isCompleted && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-green-900">
                        Pagamento confirmado!
                      </p>
                      <p className="text-sm text-green-800">
                        Seu cartão foi recarregado com sucesso.
                      </p>
                      {feeInfo && (
                        <div className="text-sm text-green-800 space-y-1 pt-2 border-t border-green-200">
                          <div className="flex justify-between">
                            <span>Valor creditado:</span>
                            <span className="font-bold">
                              {formatCurrency(feeInfo.netAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {(isExpired || isCancelled || hasError) && (
                <Alert className="border-red-500 bg-red-50">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-red-900">
                        {isExpired && 'Pagamento expirado'}
                        {isCancelled && 'Pagamento cancelado'}
                        {hasError && 'Erro no pagamento'}
                      </p>
                      <p className="text-sm text-red-800">
                        {pixError || 'Tente novamente ou entre em contato com o suporte.'}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleClose} className="w-full">
                {isCompleted ? 'Ver Saldo Atualizado' : 'Fechar'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Made with Bob
