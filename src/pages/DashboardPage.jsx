import { CalendarPlus, DoorOpen, UserPlus, TrendingUp, Wallet, BedDouble, LogIn, LogOut } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useLanguage } from '../hooks/useLanguage'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'
import { getDashboardMockData } from '../services/dashboard.mock'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import './DashboardPage.css'

const mock = getDashboardMockData()

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { rooms, loading } = useRooms()

  const counts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})
  const availableCount = loading ? '—' : (counts.available || 0)

  const name = user?.user_metadata?.name?.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="dash">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-content">
          <h1>{t('welcome_back')}{name ? `, ${name}` : ''}</h1>
          <p className="dash-subtitle">{today} — {t('dashboard_subtitle')}</p>
          <div className="dash-hero-summary">
            <span><LogIn size={14} /> {mock.todaySummary.checkIns} check-ins today</span>
            <span><LogOut size={14} /> {mock.todaySummary.checkOuts} check-outs today</span>
            <span><CalendarPlus size={14} /> {mock.todaySummary.newReservations} new reservations</span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="dash-kpis">
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-primary"><TrendingUp size={18} /></div>
          <div className="kpi-value">{Math.round(mock.occupancyRate * 100)}%</div>
          <div className="kpi-label">Occupancy Rate</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-success"><Wallet size={18} /></div>
          <div className="kpi-value">{mock.revenueThisMonth.toLocaleString()} <span className="kpi-unit">FCFA</span></div>
          <div className="kpi-label">Revenue this month</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-neutral"><BedDouble size={18} /></div>
          <div className="kpi-value">{availableCount}</div>
          <div className="kpi-label">{t('stat_available')} rooms</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-warning"><LogOut size={18} /></div>
          <div className="kpi-value">{mock.todaySummary.checkOuts}</div>
          <div className="kpi-label">Check-outs today</div>
        </Card>
      </div>

      {/* Chart + upcoming checkouts */}
      <div className="dash-row">
        <Card className="dash-panel dash-panel-chart">
          <h3>Booking Analytics — Last 7 days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mock.bookingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="bookings" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dash-panel">
          <h3>Upcoming Check-outs</h3>
          <div className="dash-list">
            {mock.upcomingCheckouts.map((c) => (
              <div key={c.id} className="checkout-item">
                <div className="checkout-avatar">{c.guest.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
                <div className="checkout-info">
                  <div className="checkout-name">{c.guest}</div>
                  <div className="checkout-meta">Room {c.room} · {c.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reservations table + quick actions/activity */}
      <div className="dash-row">
        <Card className="dash-panel dash-panel-wide">
          <h3>{t('recent_reservations')}</h3>
          <table className="dash-table">
            <thead>
              <tr><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mock.recentReservations.map((r) => (
                <tr key={r.id}>
                  <td>{r.guest}</td>
                  <td className="mono">{r.room}</td>
                  <td>{r.dates}</td>
                  <td><Badge status={r.status === 'active' ? 'occupied' : r.status === 'completed' ? 'available' : 'out_of_service'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="dash-side-panels">
          <Card className="dash-panel">
            <h3>{t('quick_actions')}</h3>
            <div className="dash-actions">
              <Button variant="secondary"><CalendarPlus size={16} /> {t('action_new_reservation')}</Button>
              <Button variant="secondary"><DoorOpen size={16} /> {t('action_add_room')}</Button>
              <Button variant="secondary"><UserPlus size={16} /> {t('action_add_customer')}</Button>
            </div>
          </Card>

          <Card className="dash-panel">
            <h3>Recent Activity</h3>
            <div className="dash-list">
              {mock.recentActivity.map((a) => (
                <div key={a.id} className="activity-item">
                  <span className="activity-dot" />
                  <div>
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
