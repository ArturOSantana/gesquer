import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      isEnvError: false
    }
  }

  static getDerivedStateFromError(error) {
    // Detectar se é erro de variáveis de ambiente
    const isEnvError = error.message?.includes('environment variables') || 
                       error.message?.includes('Supabase') ||
                       error.message?.includes('VITE_SUPABASE')
    
    return { 
      hasError: true,
      isEnvError
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <CardTitle className="text-2xl">
                    {this.state.isEnvError ? 'Configuração Necessária' : 'Ops! Algo deu errado'}
                  </CardTitle>
                  <CardDescription>
                    {this.state.isEnvError 
                      ? 'O sistema precisa ser configurado antes de usar'
                      : 'Ocorreu um erro inesperado na aplicação'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.isEnvError ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Variáveis de Ambiente Não Configuradas</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>Para usar o sistema, você precisa configurar as variáveis de ambiente do Supabase:</p>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Acesse o painel da Vercel</li>
                      <li>Vá em Settings → Environment Variables</li>
                      <li>Adicione as seguintes variáveis:</li>
                    </ol>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md mt-2 font-mono text-sm">
                      <div>VITE_SUPABASE_URL=sua-url-do-supabase</div>
                      <div>VITE_SUPABASE_ANON_KEY=sua-chave-anonima</div>
                    </div>
                    <p className="mt-2 text-sm">
                      Após configurar, faça um novo deploy ou aguarde o redeploy automático.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na Aplicação</AlertTitle>
                  <AlertDescription>
                    {this.state.error?.message || 'Erro desconhecido'}
                  </AlertDescription>
                </Alert>
              )}

              {isDevelopment && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Detalhes técnicos (apenas em desenvolvimento)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar Página
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Ir para Início
                </Button>
              </div>

              {this.state.isEnvError && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>📚 Documentação:</strong> Consulte o arquivo{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded">VERCEL-DEPLOY.md</code>{' '}
                    para instruções completas de configuração.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Made with Bob