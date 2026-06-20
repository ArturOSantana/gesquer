import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ArrowLeft, RefreshCw, AlertCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { Alert, AlertDescription } from '../../components/ui/alert'

export default function ExibirSaldo() {
  const { uuid } = useParams()
  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState(null)
  
  const fetchCardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar cartão pelo UUID
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select(`
          *,
          client:clients(name, phone)
        `)
        .eq('uuid', uuid)
        .eq('status', 'active')
        .single()
      
      if (cardError) {
        console.error('Erro ao buscar cartão:', cardError)
        throw new Error('Cartão não encontrado ou inativo')
      }
      
      if (!cardData) {
        throw new Error('Cartão não encontrado')
      }
      
      setCard(cardData)
      
      // Buscar transações do cartão
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          barraca:barracas(name)
        `)
        .eq('card_id', cardData.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (txError) {
        console.error('Erro ao buscar transações:', txError)
        // Não falhar se não conseguir buscar transações
        setTransactions([])
      } else {
        setTransactions(txData || [])
      }
      
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCardData()
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchCardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [uuid])
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `Há ${diffMins} min`
    if (diffHours < 24) return `Há ${diffHours}h`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `Há ${diffDays} dias`
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'recharge':
      case 'transfer_in':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'purchase':
      case 'transfer_out':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />
    }
  }
  
  const getTransactionLabel = (type) => {
    switch (type) {
      case 'recharge':
        return 'Recarga'
      case 'purchase':
        return 'Compra'
      case 'transfer_in':
        return 'Transferência Recebida'
      case 'transfer_out':
        return 'Transferência Enviada'
      default:
        return type
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Link to="/consulta">
              <Button className="w-full" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar e Tentar Novamente
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-20">
      {/* Header */}
      <div className="max-w-md mx-auto mt-4 mb-6">
        <Link to="/consulta">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
      
      {/* Saldo */}
      <Card className="max-w-md mx-auto mb-6 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="text-center text-xl">
            {card.client.name}
          </CardTitle>
          {card.client.phone && (
            <p className="text-center text-sm opacity-90">
              {card.client.phone}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Saldo Disponível</p>
            <p className="text-5xl font-bold text-green-600 mb-1">
              {formatCurrency(card.balance)}
            </p>
            <p className="text-xs text-gray-500">
              Atualizado automaticamente
            </p>
          </div>
          <Button 
            onClick={fetchCardData}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Agora
          </Button>
        </CardContent>
      </Card>
      
      {/* Histórico */}
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nenhuma transação ainda</p>
              <p className="text-sm text-gray-400 mt-1">
                Suas compras e recargas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {getTransactionLabel(tx.type)}
                    </p>
                    {tx.barraca && (
                      <p className="text-sm text-gray-600 truncate">
                        {tx.barraca.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${
                      tx.type === 'recharge' || tx.type === 'transfer_in'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {tx.type === 'recharge' || tx.type === 'transfer_in' ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="max-w-md mx-auto mt-6 text-center">
        <p className="text-xs text-gray-500">
          🎪 Sistema de Gestão de Quermesse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Página atualizada automaticamente a cada 30 segundos
        </p>
      </div>
    </div>
  )
}

// Made with Bob
