import { Link } from 'react-router-dom'
import { QrCode, ShoppingCart, Package, ArrowLeftRight, History, Store, CreditCard, BarChart3 } from 'lucide-react'

export default function Home() {
  const features = [
    {
      title: 'Escanear Cartão',
      description: 'Leia QR codes dos cartões',
      icon: QrCode,
      link: '/scan',
      color: 'bg-blue-500',
    },
    {
      title: 'Realizar Venda',
      description: 'Processar vendas e pagamentos',
      icon: ShoppingCart,
      link: '/sale',
      color: 'bg-green-500',
    },
    {
      title: 'Gestão de Estoque',
      description: 'Controlar produtos e estoque',
      icon: Package,
      link: '/stock',
      color: 'bg-purple-500',
    },
    {
      title: 'Transferências',
      description: 'Transferir saldo entre cartões',
      icon: ArrowLeftRight,
      link: '/transfer',
      color: 'bg-orange-500',
    },
    {
      title: 'Histórico',
      description: 'Ver transações realizadas',
      icon: History,
      link: '/history',
      color: 'bg-indigo-500',
    },
    {
      title: 'Barracas',
      description: 'Gerenciar barracas',
      icon: Store,
      link: '/barracas',
      color: 'bg-pink-500',
    },
    {
      title: 'Cartões',
      description: 'Gerenciar cartões',
      icon: CreditCard,
      link: '/cards',
      color: 'bg-teal-500',
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios',
      icon: BarChart3,
      link: '/reports',
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Sistema de Quermesse</h1>
        <p className="text-xl text-muted-foreground">
          Gestão completa de cartões, vendas e estoque
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.link}
              to={feature.link}
              className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`${feature.color} p-4 rounded-full text-white group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ir para Dashboard
        </Link>
      </div>
    </div>
  )
}

// Made with Bob
