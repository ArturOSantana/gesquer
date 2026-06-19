import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scan" element={<ScanCard />} />
            <Route path="scan-card" element={<ScanCard />} />
            <Route path="sale" element={<Sale />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="transfer" element={<TransferBalance />} />
            <Route path="history" element={<TransactionHistory />} />
            <Route path="barracas" element={<BarracaManagement />} />
            <Route path="cards" element={<CardManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin/generate-batch" element={<GenerateBatch />} />
            <Route path="caixa/novo-cliente" element={<NovoCliente />} />
            <Route path="caixa/transferir-cartao" element={<TransferirCartao />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </>
  )
}

export default App

// Made with Bob
