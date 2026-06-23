/**
 * Página dedicada para recarga via PIX
 * Rota: /recarregar-pix/:uuid
 * Permite recarga direta via link/QR code
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { PixRechargeModal } from '../components/PixRechargeModal';
import { formatCurrency } from '../api/woovi';

export function RecarregarPix() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Busca dados do cartão
  useEffect(() => {
    async function fetchCard() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('cards')
          .select('uuid, card_number, balance, status')
          .eq('uuid', uuid)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          throw new Error('Cartão não encontrado');
        }

        if (data.status !== 'active') {
          throw new Error('Cartão inativo ou bloqueado');
        }

        setCard(data);
        
        // Abre modal automaticamente
        setIsModalOpen(true);
      } catch (err) {
        console.error('Erro ao buscar cartão:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (uuid) {
      fetchCard();
    }
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando informações do cartão...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Cartão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Recarga via PIX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Cartão */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm opacity-90">Cartão</p>
              <p className="text-2xl font-bold tracking-wider">
                {card.card_number}
              </p>
              <div className="flex justify-between items-end pt-4">
                <div>
                  <p className="text-xs opacity-75">Saldo Atual</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(card.balance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">Status</p>
                  <p className="text-sm font-medium">Ativo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações sobre PIX */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <ul className="space-y-1 mt-2">
                <li>✓ Recarga instantânea via PIX</li>
                <li>✓ Taxa de apenas 0,99%</li>
                <li>✓ Confirmação automática</li>
                <li>✓ Disponível 24/7</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="space-y-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              size="lg"
            >
              Iniciar Recarga
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(`/consultar-saldo/${uuid}`)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Consulta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Recarga */}
      {card && (
        <PixRechargeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Redireciona para consulta após fechar
            navigate(`/consultar-saldo/${uuid}`);
          }}
          cardUuid={card.uuid}
          cardNumber={card.card_number}
          currentBalance={card.balance}
        />
      )}
    </div>
  );
}

// Made with Bob
