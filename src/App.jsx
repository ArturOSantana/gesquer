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
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<ScanCard />} />
          <Route path="sale" element={<Sale />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="transfer" element={<TransferBalance />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="barracas" element={<BarracaManagement />} />
          <Route path="cards" element={<CardManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

// Made with Bob
