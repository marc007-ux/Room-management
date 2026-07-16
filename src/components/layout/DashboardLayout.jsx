import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="app-shell-main">
        <Header collapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="app-shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}