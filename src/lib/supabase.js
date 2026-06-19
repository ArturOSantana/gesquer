import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as variáveis de ambiente estão configuradas
const isConfigured = supabaseUrl &&
                     supabaseAnonKey &&
                     !supabaseUrl.includes('your-project') &&
                     !supabaseAnonKey.includes('your-anon-key')

// Cliente mock para quando não estiver configurado
const createMockClient = () => {
  const mockError = {
    error: {
      message: 'Supabase não configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY',
      code: 'SUPABASE_NOT_CONFIGURED'
    },
    data: null
  }
  
  return {
    from: () => ({
      select: () => Promise.resolve(mockError),
      insert: () => Promise.resolve(mockError),
      update: () => Promise.resolve(mockError),
      delete: () => Promise.resolve(mockError),
      upsert: () => Promise.resolve(mockError),
    }),
    auth: {
      getSession: () => Promise.resolve(mockError),
      signIn: () => Promise.resolve(mockError),
      signOut: () => Promise.resolve(mockError),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockError),
        download: () => Promise.resolve(mockError),
      })
    }
  }
}

// Criar cliente Supabase ou mock
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-application-name': 'quermesse-system'
        }
      },
      db: {
        schema: 'public'
      }
    })
  : createMockClient()

// Flag para verificar se está configurado
export const isSupabaseConfigured = isConfigured

// Log de status
if (!isConfigured) {
  console.warn('⚠️ Supabase não configurado - usando cliente mock')
  console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o sistema')
} else {
  console.log('✅ Supabase configurado corretamente')
}

/**
 * Testa a conexão com o Supabase
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testConnection() {
  try {
    const { error } = await supabase.from('cards').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    return { success: true }
  } catch (err) {
    console.error('❌ Erro ao testar conexão:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Executa uma operação com retry automático
 * @param {Function} operation - Função assíncrona a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} delay - Delay entre tentativas em ms
 * @returns {Promise<any>}
 */
export async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Não fazer retry em erros de validação ou autenticação
      if (error.code === 'PGRST116' || error.code === '23505' || error.status === 401) {
        throw error
      }
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }
  
  console.error(`❌ Operação falhou após ${maxRetries} tentativas`)
  throw lastError
}

/**
 * Wrapper para operações do Supabase com melhor tratamento de erros
 * @param {Function} operation - Operação do Supabase
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function safeSupabaseOperation(operation) {
  try {
    const result = await withRetry(operation)
    
    if (result.error) {
      // Traduzir erros comuns
      const errorMessages = {
        'PGRST116': 'Registro não encontrado',
        '23505': 'Registro duplicado - já existe um registro com estes dados',
        '23503': 'Operação inválida - registro relacionado não existe',
        '42P01': 'Tabela não encontrada - verifique a configuração do banco de dados',
        'PGRST301': 'Permissão negada - verifique as políticas de segurança',
      }
      
      const friendlyError = errorMessages[result.error.code] || result.error.message
      
      return {
        data: null,
        error: friendlyError
      }
    }
    
    return {
      data: result.data,
      error: null
    }
  } catch (err) {
    console.error('Erro na operação:', err)
    
    // Erros de rede
    if (err.message.includes('fetch') || err.message.includes('network')) {
      return {
        data: null,
        error: 'Erro de conexão. Verifique sua internet e tente novamente.'
      }
    }
    
    return {
      data: null,
      error: err.message || 'Erro desconhecido'
    }
  }
}

// Made with Bob
