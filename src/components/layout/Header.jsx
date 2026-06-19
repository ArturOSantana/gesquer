import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, LayoutDashboard, QrCode, ShoppingCart, Package, ArrowLeftRight, History, Store, CreditCard, BarChart3, Menu, LogOut, User, Users, Wallet, UserPlus, Layers, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { getRoleLabel, getRoleBadgeColor } from '../../lib/permissions'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const { profile, logout, isAuthenticated } = useAuth()

  // Navegação baseada no perfil do usuário
  const getNavigation = () => {
    if (!profile) return []

    // Menu para SUPERADMIN - Acesso completo com Admin
    if (profile.role === 'superadmin') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
          name: 'Caixa',
          icon: Wallet,
          dropdown: [
            { name: 'Novo Cliente', href: '/caixa/novo-cliente', icon: UserPlus },
            { name: 'Recarregar', href: '/caixa/recarga', icon: CreditCard },
            { name: 'Transferir', href: '/caixa/transferir-cartao', icon: ArrowLeftRight },
          ]
        },
        {
          name: 'Gestão',
          icon: Store,
          dropdown: [
            { name: 'Barracas', href: '/barracas', icon: Store },
            { name: 'Estoque', href: '/estoque', icon: Package },
            { name: 'Cartões', href: '/cards', icon: CreditCard },
          ]
        },
        {
          name: 'Relatórios',
          icon: BarChart3,
          dropdown: [
            { name: 'Histórico', href: '/historico', icon: History },
            { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
          ]
        },
        {
          name: 'Admin',
          icon: Users,
          dropdown: [
            { name: 'Usuários', href: '/admin/usuarios', icon: Users },
            { name: 'Gerar Lote', href: '/admin/gerar-lote', icon: Layers },
          ]
        },
      ]
    }

    // Menu para ADMIN - Sem acesso a Admin (Usuários e Gerar Lote)
    if (profile.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
          name: 'Caixa',
          icon: Wallet,
          dropdown: [
            { name: 'Novo Cliente', href: '/caixa/novo-cliente', icon: UserPlus },
            { name: 'Recarregar', href: '/caixa/recarga', icon: CreditCard },
            { name: 'Transferir', href: '/caixa/transferir-cartao', icon: ArrowLeftRight },
          ]
        },
        {
          name: 'Gestão',
          icon: Store,
          dropdown: [
            { name: 'Barracas', href: '/barracas', icon: Store },
            { name: 'Estoque', href: '/estoque', icon: Package },
            { name: 'Cartões', href: '/cards', icon: CreditCard },
          ]
        },
        {
          name: 'Relatórios',
          icon: BarChart3,
          dropdown: [
            { name: 'Histórico', href: '/historico', icon: History },
            { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
          ]
        },
      ]
    }

    // Menu para CAIXA - Focado e limpo
    if (profile.role === 'caixa') {
      return [
        { name: 'Novo Cliente', href: '/caixa/novo-cliente', icon: UserPlus },
        { name: 'Recarregar', href: '/caixa/recarga', icon: CreditCard },
        { name: 'Transferir', href: '/caixa/transferir-cartao', icon: ArrowLeftRight },
        { name: 'Histórico', href: '/historico', icon: History },
      ]
    }

    // Menu para BARRACA - Simples e direto
    if (profile.role === 'barraca') {
      return [
        { name: 'Venda', href: '/sale', icon: ShoppingCart },
        { name: 'Histórico', href: '/historico', icon: History },
      ]
    }

    return []
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
            {navigation.map((item, index) => {
              const Icon = item.icon
              
              // Item com dropdown
              if (item.dropdown) {
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {openDropdown === index && (
                      <div className="absolute top-full left-0 mt-1 w-48 rounded-md border bg-popover shadow-lg z-50">
                        <div className="p-1">
                          {item.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                  isActive(subItem.href)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              
              // Item normal
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
            <div className="space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon
                
                // Item com dropdown
                if (item.dropdown) {
                  return (
                    <div key={index}>
                      <div className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      <div className="ml-4 mt-1 space-y-1">
                        {item.dropdown.map((subItem) => {
                          const SubIcon = subItem.icon
                          return (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                isActive(subItem.href)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <SubIcon className="h-4 w-4" />
                              <span>{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
                
                // Item normal
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
