import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, LayoutDashboard, QrCode, ShoppingCart, Package, ArrowLeftRight, History, Store, CreditCard, Grid, BarChart3, Menu, LogOut, User, Users, Wallet, UserPlus, Layers } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { getRoleLabel, getRoleBadgeColor } from '../../lib/permissions'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { profile, logout, isAuthenticated } = useAuth()

  // Navegação baseada no perfil do usuário
  const getNavigation = () => {
    if (!profile) return []

    const baseItems = [
      { name: 'Home', href: '/', icon: Home },
    ]

    // Menu para ADMIN
    if (profile.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Escanear', href: '/scan', icon: QrCode },
        { name: 'Venda', href: '/sale', icon: ShoppingCart },
        { name: 'Cartões', href: '/cards', icon: CreditCard },
        { name: 'Histórico', href: '/historico', icon: History },
        { name: 'Barracas', href: '/barracas', icon: Store },
        { name: 'Estoque', href: '/estoque', icon: Package },
        { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
        { name: 'Usuários', href: '/admin/usuarios', icon: Users },
        { name: 'Gerar Lote', href: '/admin/gerar-lote', icon: Layers },
      ]
    }

    // Menu para CAIXA
    if (profile.role === 'caixa') {
      return [
        ...baseItems,
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Escanear', href: '/scan', icon: QrCode },
        { name: 'Novo Cliente', href: '/caixa/novo-cliente', icon: UserPlus },
        { name: 'Recarga', href: '/caixa/recarga', icon: Wallet },
        { name: 'Transferir', href: '/caixa/transferir-cartao', icon: ArrowLeftRight },
        { name: 'Cartões', href: '/cards', icon: CreditCard },
        { name: 'Histórico', href: '/historico', icon: History },
      ]
    }

    // Menu para BARRACA
    if (profile.role === 'barraca') {
      return [
        ...baseItems,
        { name: 'Venda', href: '/sale', icon: ShoppingCart },
        { name: 'Histórico', href: '/historico', icon: History },
      ]
    }

    return baseItems
  }

  const navigation = getNavigation()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Não mostrar header na página de login
  if (location.pathname === '/login') {
    return null
  }

  // Não mostrar header se não estiver autenticado
  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              QuermesseOn!
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{profile?.name}</p>
                <Badge className={`${getRoleBadgeColor(profile?.role)} text-xs`}>
                  {getRoleLabel(profile?.role)}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t py-4">
            {/* User Info Mobile */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{profile?.name}</p>
                  <Badge className={`${getRoleBadgeColor(profile?.role)} text-xs`}>
                    {getRoleLabel(profile?.role)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
