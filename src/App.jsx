import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { EventProvider } from './contexts/EventContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ScanCard from './pages/ScanCard'
import Sale from './pages/Sale'
import StockManagement from './pages/StockManagement'
import TransferBalance from './pages/TransferBalance'
import TransactionHistory from './pages/TransactionHistory'
import BarracaManagement from './pages/BarracaManagement'
import BarracaDetails from './pages/BarracaDetails'
import CardManagement from './pages/CardManagement'
import Reports from './pages/Reports'
import GenerateBatch from './pages/admin/GenerateBatch'
import BatchList from './pages/admin/BatchList'
import BatchDetails from './pages/admin/BatchDetails'
import Users from './pages/admin/Users'
import GerarQRLote from './pages/admin/GerarQRLote'
import EventManagement from './pages/admin/EventManagement'
import EventDetails from './pages/admin/EventDetails'
import NewEvent from './pages/admin/NewEvent'
import OrganizationManagement from './pages/admin/OrganizationManagement'
import NewOrganization from './pages/admin/NewOrganization'
import OrganizationDetails from './pages/admin/OrganizationDetails'
import OrganizationLimits from './pages/admin/OrganizationLimits'
import MyOrganizationUsers from './pages/admin/MyOrganizationUsers'
import NovoCliente from './pages/caixa/NovoCliente'
import Recarga from './pages/caixa/Recarga'
import TransferirCartao from './pages/caixa/TransferirCartao'
import ConsultaSaldo from './pages/public/ConsultaSaldo'
import ExibirSaldo from './pages/public/ExibirSaldo'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/toaster'
import SupabaseConfigWarning from './components/SupabaseConfigWarning'
import { FEATURES } from './lib/features'
import { RecarregarPix } from './features/pix-recharge'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import AuditLogs from './pages/admin/AuditLogs'
import SupportTools from './pages/admin/SupportTools'
import RevenueReports from './pages/admin/RevenueReports'

function App() {
  return (
    <>
      <SupabaseConfigWarning />
      <Router>
        <AuthProvider>
          <OrganizationProvider>
            <EventProvider>
              <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/consulta" element={<ConsultaSaldo />} />
            <Route path="/consulta/:uuid" element={<ExibirSaldo />} />
            
            {/* Rota PIX - Condicional */}
            {FEATURES.PIX_RECHARGE && (
              <Route path="/recarregar-pix/:uuid" element={<RecarregarPix />} />
            )}

            {/* Rotas protegidas */}
            <Route path="/" element={<Layout />}>
              {/* Home - Todos os perfis */}
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* Visão - SuperAdmin, Admin e Caixa */}
              <Route
                path="visao"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Escanear - SuperAdmin, Admin e Caixa */}
              <Route
                path="scan"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <ScanCard />
                  </ProtectedRoute>
                }
              />

              {/* Venda - SuperAdmin, Admin e PDV */}
              <Route
                path="sale"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'pdv']}>
                    <Sale />
                  </ProtectedRoute>
                }
              />

              {/* Estoque - Admin e SuperAdmin */}
              <Route
                path="estoque"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <StockManagement />
                  </ProtectedRoute>
                }
              />

              {/* Transferir Saldo - SuperAdmin, Admin e Caixa */}
              <Route
                path="transferir-saldo"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <TransferBalance />
                  </ProtectedRoute>
                }
              />

              {/* Histórico - Todos (filtrado por perfil) */}
              <Route
                path="historico"
                element={
                  <ProtectedRoute>
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />

              {/* Barracas - Admin e SuperAdmin */}
              <Route
                path="barracas"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <BarracaManagement />
                  </ProtectedRoute>
                }
              />

              {/* Detalhes da Barraca - Admin e SuperAdmin */}
              <Route
                path="barracas/:barracaId"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <BarracaDetails />
                  </ProtectedRoute>
                }
              />

              {/* Cartões - Admin, SuperAdmin e Caixa */}
              <Route
                path="cards"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <CardManagement />
                  </ProtectedRoute>
                }
              />

              {/* Relatórios - Admin e SuperAdmin */}
              <Route
                path="relatorios"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Gerar Lote - APENAS SUPERADMIN */}
              <Route
                path="admin/gerar-lote"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <GenerateBatch />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Ver Lotes - APENAS SUPERADMIN */}
              <Route
                path="admin/batches"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <BatchList />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Detalhes do Lote - APENAS SUPERADMIN */}
              <Route
                path="admin/batches/:id"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <BatchDetails />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Usuários - APENAS SUPERADMIN */}
              <Route
                path="admin/usuarios"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Meus Usuários - ADMIN E SUPERADMIN */}
              <Route
                path="admin/meus-usuarios"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <MyOrganizationUsers />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Gerar QR Codes em Lote - APENAS SUPERADMIN */}
              <Route
                path="admin/gerar-qr-lote"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <GerarQRLote />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Eventos - APENAS SUPERADMIN */}
              <Route
                path="admin/events"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <EventManagement />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Detalhes do Evento - APENAS SUPERADMIN */}
              <Route
                path="admin/events/:eventId"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Novo Evento - APENAS SUPERADMIN */}
              <Route
                path="admin/events/new"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <NewEvent />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Organizações - APENAS SUPERADMIN */}
              <Route
                path="admin/organizations"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationManagement />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Nova Organização - APENAS SUPERADMIN */}
              <Route
                path="admin/organizations/new"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <NewOrganization />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Detalhes da Organização - APENAS SUPERADMIN */}
              <Route
                path="admin/organizations/:id"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationDetails />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Gerenciar Limites da Organização - APENAS SUPERADMIN */}
              <Route
                path="admin/organizations/:id/limits"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationLimits />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Dashboard Principal */}
              <Route
                path="superadmin"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Logs de Auditoria */}
              <Route
                path="superadmin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Ferramentas de Suporte */}
              <Route
                path="superadmin/support"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SupportTools />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Relatórios de Receita */}
              <Route
                path="superadmin/revenue"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <RevenueReports />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Gerenciar Organizações (alias) */}
              <Route
                path="superadmin/organizations"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationManagement />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Gerenciar Planos (redireciona para PlanManagement quando criado) */}
              <Route
                path="superadmin/plans"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationManagement />
                  </ProtectedRoute>
                }
              />

              {/* SuperAdmin - Gerenciar Assinaturas (redireciona para SubscriptionManagement quando criado) */}
              <Route
                path="superadmin/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <OrganizationManagement />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Novo Cliente */}
              <Route
                path="caixa/novo-cliente"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <NovoCliente />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Recarga */}
              <Route
                path="caixa/recarga"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <Recarga />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Transferir Cartão */}
              <Route
                path="caixa/transferir-cartao"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'caixa']}>
                    <TransferirCartao />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
              </Routes>
              <Toaster />
            </EventProvider>
          </OrganizationProvider>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
