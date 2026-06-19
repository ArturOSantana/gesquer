// =====================================================
// EDGE FUNCTION: Confirmar Email de Usuário
// =====================================================
// 
// Esta função confirma automaticamente o email de um usuário
// após sua criação pelo SUPERADMIN
//
// Endpoint: POST /functions/v1/confirm-user-email
// Body: { userId: string }
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticação do usuário que está fazendo a requisição
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    // Verificar se o usuário é SUPERADMIN
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Não autorizado')
    }

    // Verificar role do usuário
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      throw new Error('Apenas SUPERADMIN pode confirmar emails')
    }

    // Obter userId do body
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('userId é obrigatório')
    }

    // Confirmar email do usuário usando Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        email_confirm: true,
        // Também podemos definir que o usuário está ativo
        ban_duration: 'none'
      }
    )

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email confirmado com sucesso',
        user: data.user 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Made with Bob
