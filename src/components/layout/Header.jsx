import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Bell, LogOut, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import './Header.css'

const MOCK_NOTIFICATIONS = [
  { id: 1, key: 'notif_checkout_soon' },
  { id: 2, key: 'notif_maintenance_done' },
  { id: 3, key: 'notif_payment_received' },
]

export default function Header({ collapsed, onToggleSidebar }) {
  const { language, toggleLanguage, t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.name || user?.email || ''
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="header">
      <div className="header-title">{t('header_title')}</div>

      <div className="header-left">
        <button className="header-icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div className="header-title">{t('header_title')}</div>
      </div>

      <div className="header-actions">
        <button className="header-icon-btn" onClick={toggleLanguage} title={t('switch_language')}>
          <Globe size={18} />
          <span className="header-lang-code">{language.toUpperCase()}</span>
        </button>

        <div className="header-dropdown-wrapper" ref={notifRef}>
          <button className="header-icon-btn" onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={18} />
            <span className="header-badge">{MOCK_NOTIFICATIONS.length}</span>
          </button>
          {notifOpen && (
            <div className="header-dropdown">
              <div className="header-dropdown-title">{t('notifications')}</div>
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="notif-item">{t(n.key)}</div>
              ))}
            </div>
          )}
        </div>

        <div className="header-dropdown-wrapper" ref={profileRef}>
          <button className="header-profile-btn" onClick={() => setProfileOpen((v) => !v)}>
            <span className="header-avatar">{initials}</span>
            <span className="header-profile-name">{displayName}</span>
          </button>
          {profileOpen && (
            <div className="header-dropdown">
              <div className="header-dropdown-user">
                <span className="header-avatar header-avatar-lg">{initials}</span>
                <div>
                  <div className="header-dropdown-name">{user?.user_metadata?.name || t('staff_account')}</div>
                  <div className="header-dropdown-email">{user?.email}</div>
                </div>
              </div>
              <button className="header-dropdown-item">
                <Settings size={16} /> {t('settings')}
              </button>
              <button className="header-dropdown-item header-dropdown-item-danger" onClick={handleLogout}>
                <LogOut size={16} /> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}