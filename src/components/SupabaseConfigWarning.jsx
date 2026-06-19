import React from 'react'
import { AlertCircle, ExternalLink, Settings } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { isSupabaseConfigured } from '../lib/supabase'

/**
 * Componente que exibe aviso quando o Supabase não está configurado
 * Útil para desenvolvimento e troubleshooting
 */
export default function SupabaseConfigWarning() {
  // Não mostrar em produção se estiver configurado
  if (isSupabaseConfigured) {
    return null
  }

  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Configuração Necessária
              </CardTitle>
              <CardDescription>
                {isDevelopment 
                  ? 'Configure as variáveis de ambiente para usar o sistema'
                  : 'O sistema precisa ser configurado pelo administrador'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertTitle>Supabase Não Configurado</AlertTitle>
            <AlertDescription className="mt-2">
              {isDevelopment ? (
                <>
                  <p className="mb-2">Para usar o sistema localmente, você precisa:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Criar um projeto no Supabase</li>
                    <li>Copiar o arquivo <code className="bg-gray-100 px-1 py-0.5 rounded">.env.example</code> para <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code></li>
                    <li>Adicionar suas credenciais do Supabase no arquivo <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code></li>
                    <li>Reiniciar o servidor de desenvolvimento</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="mb-2">Este sistema está implantado mas não configurado. O administrador precisa:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acessar o painel da Vercel</li>
                    <li>Ir em Settings → Environment Variables</li>
                    <li>Adicionar as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</li>
                    <li>Fazer um redeploy do projeto</li>
                  </ol>
                </>
              )}
            </AlertDescription>
          </Alert>

          {isDevelopment && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm space-y-2">
              <div className="text-gray-400"># .env.local</div>
              <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {isDevelopment ? (
              <>
                <Button asChild className="flex-1">
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Supabase
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a 
                    href="https://github.com/seu-usuario/quermesse/blob/main/CONFIGURACAO-SUPABASE.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    Ver Documentação
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="flex-1">
                  <a 
                    href="https://vercel.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Vercel
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a 
                    href="https://github.com/seu-usuario/quermesse/blob/main/VERCEL-DEPLOY.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    Guia de Deploy
                  </a>
                </Button>
              </>
            )}
          </div>

          <div className="pt-4 border-t">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Por que estou vendo isso?
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-2">
                <p>
                  Este sistema usa o Supabase como backend (banco de dados e autenticação).
                  Para funcionar, ele precisa se conectar ao seu projeto no Supabase.
                </p>
                <p>
                  As credenciais de conexão são fornecidas através de variáveis de ambiente
                  por questões de segurança - elas nunca devem ser incluídas diretamente no código.
                </p>
                {isProduction && (
                  <p className="text-yellow-700 font-medium">
                    Em produção, essas variáveis devem ser configuradas no painel da Vercel,
                    não em arquivos .env que são ignorados pelo Git.
                  </p>
                )}
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

