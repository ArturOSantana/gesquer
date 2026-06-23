/**
 * Edge Function: pix-webhook
 * Recebe notificações da Woovi sobre pagamentos confirmados
 * e atualiza o saldo do cartão automaticamente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const WOOVI_WEBHOOK_SECRET = Deno.env.get('WOOVI_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

interface WooviWebhookPayload {
  event: string;
  charge: {
    id: string;
    correlationID: string;
    value: number;
    status: string;
    paidAt?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar assinatura do webhook (segurança)
    const signature = req.headers.get('x-webhook-signature');
    
    if (WOOVI_WEBHOOK_SECRET && signature) {
      // TODO: Implementar verificação de assinatura HMAC
      // const isValid = verifyWebhookSignature(signature, body, WOOVI_WEBHOOK_SECRET);
      // if (!isValid) throw new Error('Assinatura inválida');
    }

    // Parse payload
    const payload: WooviWebhookPayload = await req.json();

    console.log('Webhook recebido:', payload);

    // Validar evento
    if (payload.event !== 'CHARGE_COMPLETED') {
      return new Response(
        JSON.stringify({ message: 'Evento ignorado', event: payload.event }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar transação pelo charge_id
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('pix_transactions')
      .select('*')
      .eq('charge_id', payload.charge.id)
      .single();

    if (transactionError || !transaction) {
      console.error('Transação não encontrada:', payload.charge.id);
      return new Response(
        JSON.stringify({ error: 'Transação não encontrada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se já foi processada
    if (transaction.status === 'completed') {
      console.log('Transação já processada:', transaction.id);
      return new Response(
        JSON.stringify({ message: 'Transação já processada' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar cartão
    const { data: card, error: cardError } = await supabaseClient
      .from('cards')
      .select('uuid, balance, status')
      .eq('uuid', transaction.card_uuid)
      .single();

    if (cardError || !card) {
      console.error('Cartão não encontrado:', transaction.card_uuid);
      throw new Error('Cartão não encontrado');
    }

    if (card.status !== 'active') {
      console.error('Cartão inativo:', card.uuid);
      throw new Error('Cartão inativo');
    }

    // Calcular novo saldo (adiciona valor líquido)
    const newBalance = card.balance + transaction.net_amount;

    // Iniciar transação no banco
    const { error: updateError } = await supabaseClient.rpc('process_pix_payment', {
      p_transaction_id: transaction.id,
      p_card_uuid: card.uuid,
      p_net_amount: transaction.net_amount,
      p_paid_at: payload.charge.paidAt || new Date().toISOString(),
    });

    if (updateError) {
      console.error('Erro ao processar pagamento:', updateError);
      throw updateError;
    }

    console.log('Pagamento processado com sucesso:', {
      transactionId: transaction.id,
      cardUuid: card.uuid,
      amount: transaction.net_amount,
      newBalance,
    });

    // Registrar no histórico de transações
    await supabaseClient.from('transactions').insert({
      card_uuid: card.uuid,
      type: 'recharge',
      amount: transaction.net_amount,
      description: `Recarga PIX - ${transaction.customer_name}`,
      metadata: {
        pix_transaction_id: transaction.id,
        charge_id: payload.charge.id,
        gross_amount: transaction.amount,
        fee: transaction.fee,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pagamento processado',
        transactionId: transaction.id,
        cardUuid: card.uuid,
        newBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Made with Bob
