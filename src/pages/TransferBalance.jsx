import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, History, Send } from 'lucide-react';
import { TransferForm } from '@/components/transfers/TransferForm';
import { TransferConfirmation } from '@/components/transfers/TransferConfirmation';
import { TransferHistory } from '@/components/transfers/TransferHistory';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

export default function TransferBalance() {
  const { processTransfer } = useTransactions();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('transfer');
  const [transferData, setTransferData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFormSubmit = (data) => {
    setTransferData(data);
    setShowConfirmation(true);
    setSuccess(false);
    setError(null);
    setResult(null);
  };

  const handleConfirmTransfer = async () => {
    if (!transferData) return;

    try {
      setLoading(true);
      setError(null);

      const transferResult = await processTransfer(
        transferData.fromCardId,
        transferData.toCardId,
        transferData.amount,
        transferData.description
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || 'Erro ao processar transferência');
      }

      setSuccess(true);
      setResult(transferResult);

      toast({
        title: 'Transferência realizada',
        description: `${transferResult.message || 'Saldo transferido com sucesso!'}`
      });

      setTimeout(() => {
        setShowConfirmation(false);
        setTransferData(null);
        setSuccess(false);
        setResult(null);
        setActiveTab('history');
      }, 3000);

    } catch (err) {
      console.error('Erro ao processar transferência:', err);
      setError(err.message);
      toast({
        title: 'Erro na transferência',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    if (!loading) {
      setShowConfirmation(false);
      if (success) {
        setTransferData(null);
        setSuccess(false);
        setResult(null);
        setError(null);
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-8 w-8" />
            Transferência de Saldo
          </h1>
          <p className="text-muted-foreground">
            Transfira saldo entre cartões de forma segura
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="transfer" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transferência</span>
            <span className="sm:hidden">Transferir</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Transferência</CardTitle>
              <CardDescription>
                Busque os cartões de origem e destino para realizar a transferência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferForm
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Como funciona?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-bold">1.</span>
                <p>Busque o cartão de origem digitando o UUID ou telefone do cliente</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">2.</span>
                <p>Busque o cartão de destino da mesma forma</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">3.</span>
                <p>Digite o valor a ser transferido e uma descrição</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">4.</span>
                <p>Revise os dados e confirme a transferência</p>
              </div>
              <div className="flex gap-2">
                <span className="font-bold">5.</span>
                <p>A transferência será processada imediatamente e os saldos atualizados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transferências</CardTitle>
              <CardDescription>
                Visualize todas as transferências realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferHistory limit={50} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransferConfirmation
        open={showConfirmation}
        onOpenChange={handleCloseConfirmation}
        transferData={transferData}
        onConfirm={handleConfirmTransfer}
        loading={loading}
        success={success}
        error={error}
        result={result}
      />
    </div>
  );
}

// Made with Bob
