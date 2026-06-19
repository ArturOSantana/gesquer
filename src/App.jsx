import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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
import CardManagement from './pages/CardManagement'
import Reports from './pages/Reports'
import GenerateBatch from './pages/admin/GenerateBatch'
import BatchList from './pages/admin/BatchList'
import BatchDetails from './pages/admin/BatchDetails'
import Users from './pages/admin/Users'
import NovoCliente from './pages/caixa/NovoCliente'
import Recarga from './pages/caixa/Recarga'
import TransferirCartao from './pages/caixa/TransferirCartao'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/toaster'
import SupabaseConfigWarning from './components/SupabaseConfigWarning'

function App() {
  return (
    <>
      <SupabaseConfigWarning />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rota pública - Login */}
            <Route path="/login" element={<Login />} />

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

              {/* Venda - SuperAdmin, Admin e Barraca */}
              <Route
                path="sale"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'barraca']}>
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
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
