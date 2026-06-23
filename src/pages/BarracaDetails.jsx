import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/use-toast'
import { PDVOperatorsManager } from '../components/barracas/PDVOperatorsManager'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Store, Users, Package, BarChart } from 'lucide-react'
import { Spinner } from '../components/ui/Spinner'

export default function BarracaDetails() {
  const { barracaId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [barraca, setBarraca] = useState(null)
  const [availableOperators, setAvailableOperators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBarracaDetails()
    loadAvailableOperators()
  }, [barracaId])

  const loadBarracaDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('barracas')
        .select(`
          *,
          event:events(id, name)
        `)
        .eq('id', barracaId)
        .single()

      if (error) throw error
      setBarraca(data)
    } catch (error) {
      console.error('Erro ao carregar PDV:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do PDV',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', 'operador')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setAvailableOperators(data || [])
    } catch (error) {
      console.error('Erro ao carregar operadores:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!barraca) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">PDV não encontrado</p>
            <Button onClick={() => navigate('/barracas')} className="mt-4">
              Voltar para PDVs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/barracas')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para PDVs
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{barraca.name}</h1>
              <p className="text-gray-600 mt-1">
                Evento: {barraca.event?.name || 'Não especificado'}
              </p>
            </div>
          </div>
          <Badge variant={barraca.status === 'active' ? 'default' : 'secondary'}>
            {barraca.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">
            <Store className="w-4 h-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="operators">
            <Users className="w-4 h-4 mr-2" />
            Operadores
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="w-4 h-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do PDV</CardTitle>
              <CardDescription>Informações gerais sobre o ponto de venda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-lg">{barraca.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descrição</label>
                <p className="text-lg">{barraca.description || 'Sem descrição'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Localização</label>
                <p className="text-lg">{barraca.location || 'Não especificada'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg">
                  <Badge variant={barraca.status === 'active' ? 'default' : 'secondary'}>
                    {barraca.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators">
          <PDVOperatorsManager
            pdvId={barracaId}
            pdvName={barraca.name}
            availableOperators={availableOperators}
          />
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos do PDV</CardTitle>
              <CardDescription>Gerencie os produtos disponíveis neste ponto de venda</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerenciamento de produtos será implementado aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Vendas</CardTitle>
              <CardDescription>Acompanhe o desempenho do ponto de venda</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Estatísticas de vendas serão implementadas aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Made with Bob
