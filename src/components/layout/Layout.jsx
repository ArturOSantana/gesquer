import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-8">
        <Outlet />
      </main>
    </div>
  )
}

// Made with Bob
