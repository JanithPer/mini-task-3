import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function AppShell() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Header />
      <main className="container-page py-10">
        <Outlet />
      </main>
    </div>
  )
}
