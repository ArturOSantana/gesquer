/**
 * Edge Function: create-pix-payment
 * Cria uma cobrança PIX via Woovi e registra no banco
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const WOOVI_API_URL = 'https://api.woovi.com/api/v1';
const WOOVI_APP_ID = Deno.env.get('WOOVI_APP_ID');
const WOOVI_API_KEY = Deno.env.get('WOOVI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePixPaymentRequest {
  cardUuid: string;
  amount: number;
  customerName: string;
  customerTaxId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validar configuração
    if (!WOOVI_APP_ID || !WOOVI_API_KEY) {
      throw new Error('Woovi não configurado');
    }

    // Parse request
    const { cardUuid, amount, customerName, customerTaxId }: CreatePixPaymentRequest =
      await req.json();

    // Validações
    if (!cardUuid || !amount || !customerName) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo é R$ 1,00' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se cartão existe e está ativo
    const { data: card, error: cardError } = await supabaseClient
      .from('cards')
      .select('uuid, card_number, status')
      .eq('uuid', cardUuid)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: 'Cartão não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (card.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Cartão inativo' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar ID único para a transação
    const transactionId = `pix_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Criar cobrança na Woovi
    const wooviResponse = await fetch(`${WOOVI_API_URL}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WOOVI_API_KEY}`,
        'x-app-id': WOOVI_APP_ID,
      },
      body: JSON.stringify({
        correlationID: transactionId,
        value: amount,
        comment: `Recarga cartão ${card.card_number}`,
        customer: {
          name: customerName,
          taxID: customerTaxId,
        },
        expiresIn: 3600, // 1 hora
      }),
    });

    if (!wooviResponse.ok) {
      const errorData = await wooviResponse.text();
      console.error('Erro Woovi:', errorData);
      throw new Error('Erro ao criar cobrança na Woovi');
    }

    const wooviData = await wooviResponse.json();

    // Calcular taxa (0,99%)
    const fee = Math.ceil(amount * 0.0099);
    const netAmount = amount - fee;

    // Registrar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('pix_transactions')
      .insert({
        card_uuid: cardUuid,
        charge_id: wooviData.charge.id,
        correlation_id: transactionId,
        amount: amount,
        fee: fee,
        net_amount: netAmount,
        status: 'pending',
        customer_name: customerName,
        customer_tax_id: customerTaxId,
        qr_code_text: wooviData.charge.qrCodeText,
        qr_code_image: wooviData.charge.qrCodeImage,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        metadata: {
          woovi_charge: wooviData.charge,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError);
      throw new Error('Erro ao registrar transação');
    }

    // Retornar dados da cobrança
    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        chargeId: wooviData.charge.id,
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        qrCodeText: wooviData.charge.qrCodeText,
        qrCodeImage: wooviData.charge.qrCodeImage,
        expiresAt: transaction.expires_at,
        status: 'pending',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na função:', error);
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
