import { NavLink } from 'react-router-dom'
import { LayoutDashboard, DoorOpen, Tags, Users, CalendarCheck, CreditCard } from 'lucide-react'
import logo from '../../assets/logo.png'
import { useLanguage } from '../../context/LanguageContext'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav_dashboard' },
  { to: '/rooms', icon: DoorOpen, key: 'nav_rooms' },
  { to: '/categories', icon: Tags, key: 'nav_categories' },
  { to: '/customers', icon: Users, key: 'nav_customers' },
  { to: '/reservations', icon: CalendarCheck, key: 'nav_reservations' },
  { to: '/payments', icon: CreditCard, key: 'nav_payments' },
]

export default function Sidebar({ collapsed }) {
  const { t } = useLanguage()

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            title={collapsed ? t(key) : undefined}
          >
            <Icon size={18} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}