import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    // Criar cliente Supabase com service role key
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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Verificar se usuário é Admin ou SuperAdmin
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (roleError || !['admin', 'superadmin'].includes(userData?.role)) {
      throw new Error('Apenas Admin ou SuperAdmin podem criar usuários')
    }

    // Pegar dados da requisição
    const { name, email, password, role, organization_id } = await req.json()

    if (!name || !email || !password || !role) {
      throw new Error('Todos os campos são obrigatórios')
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }

    // Validar senha
    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres')
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('Este email já está cadastrado')
    }

    // Verificar limite de usuários
    const { data: canCreate, error: limitError } = await supabaseAdmin
      .rpc('can_create_user', {
        org_id: organization_id,
        user_role: role
      })

    if (limitError) {
      console.error('Erro ao verificar limite:', limitError)
    }

    if (!canCreate) {
      throw new Error('Limite de usuários atingido para esta organização')
    }

    // Criar usuário usando Admin API (sem rate limit)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        name: name,
        role: role,
        organization_id: organization_id
      }
    })

    if (createError) {
      throw createError
    }

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 500))

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso',
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Made with Bob
