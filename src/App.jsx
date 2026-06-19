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
import Users from './pages/admin/Users'
import NovoCliente from './pages/caixa/NovoCliente'
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

              {/* Dashboard - Admin e Caixa */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Escanear - Admin e Caixa */}
              <Route
                path="scan"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
                    <ScanCard />
                  </ProtectedRoute>
                }
              />

              {/* Venda - Admin e Barraca */}
              <Route
                path="sale"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'barraca']}>
                    <Sale />
                  </ProtectedRoute>
                }
              />

              {/* Estoque - Apenas Admin */}
              <Route
                path="estoque"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <StockManagement />
                  </ProtectedRoute>
                }
              />

              {/* Transferir Saldo - Admin e Caixa */}
              <Route
                path="transferir-saldo"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
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

              {/* Barracas - Apenas Admin */}
              <Route
                path="barracas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BarracaManagement />
                  </ProtectedRoute>
                }
              />

              {/* Cartões - Admin e Caixa */}
              <Route
                path="cards"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
                    <CardManagement />
                  </ProtectedRoute>
                }
              />

              {/* Relatórios - Apenas Admin */}
              <Route
                path="relatorios"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Gerar Lote */}
              <Route
                path="admin/gerar-lote"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <GenerateBatch />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Usuários */}
              <Route
                path="admin/usuarios"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Novo Cliente */}
              <Route
                path="caixa/novo-cliente"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
                    <NovoCliente />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Recarga */}
              <Route
                path="caixa/recarga"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
                    <ScanCard />
                  </ProtectedRoute>
                }
              />

              {/* Caixa - Transferir Cartão */}
              <Route
                path="caixa/transferir-cartao"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'caixa']}>
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
