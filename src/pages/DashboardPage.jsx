import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, DoorOpen, UserPlus, TrendingUp, Wallet, BedDouble, LogIn, LogOut } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useLanguage } from '../hooks/useLanguage'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'
import { customersService } from '../services/customers.service'
import { reservationsService } from '../services/reservations.service'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import './DashboardPage.css'

function formatCurrency(value, language) {
  const amount = Number(value || 0)
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`
}

function formatDateShort(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
}

function formatDateKey(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatRelativeLabel(value) {
  if (!value) return 'Recently'
  const diffMs = Date.now() - new Date(value).getTime()
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))

  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.max(1, Math.round(diffHours / 24))
  return `${diffDays}d ago`
}

function getBadgeStatus(status) {
  if (status === 'active') return 'occupied'
  if (status === 'completed') return 'available'
  return 'out_of_service'
}

export default function DashboardPage() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { rooms, loading: roomsLoading } = useRooms()
  const [reservations, setReservations] = useState([])
  const [customers, setCustomers] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState(null)

  useEffect(() => {
    let isActive = true

    async function loadDashboardData() {
      setDashboardLoading(true)
      setDashboardError(null)

      try {
        const [reservationData, customerData] = await Promise.all([
          reservationsService.getAll(),
          customersService.getAll(),
        ])

        if (!isActive) return

        setReservations(reservationData || [])
        setCustomers(customerData || [])
      } catch (err) {
        if (!isActive) return
        setDashboardError(err?.message || t('reservation_error_title'))
      } finally {
        if (isActive) setDashboardLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isActive = false
    }
  }, [t])

  const counts = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.status] = (acc[room.status] || 0) + 1
      return acc
    }, {})
  }, [rooms])

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers])
  const roomMap = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms])

  const loading = roomsLoading || dashboardLoading
  const availableCount = loading ? '—' : (counts.available || 0)

  const occupancyRate = useMemo(() => {
    const usableRooms = rooms.filter((room) => !['maintenance', 'out_of_service'].includes(room.status))
    if (!usableRooms.length) return 0

    const occupiedRoomIds = new Set(
      reservations.filter((reservation) => reservation.status === 'active' && reservation.room_id).map((reservation) => reservation.room_id),
    )
    const occupiedCount = usableRooms.filter((room) => occupiedRoomIds.has(room.id) || room.status === 'occupied').length

    return occupiedCount / usableRooms.length
  }, [reservations, rooms])

  const todaySummary = useMemo(() => {
    const todayKey = formatDateKey(new Date())

    return {
      checkIns: reservations.filter((reservation) => formatDateKey(reservation.start_date) === todayKey).length,
      checkOuts: reservations.filter((reservation) => formatDateKey(reservation.end_date) === todayKey && reservation.status === 'active').length,
      newReservations: reservations.filter((reservation) => formatDateKey(reservation.created_at) === todayKey).length,
    }
  }, [reservations])

  const revenueThisMonth = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    return reservations.reduce((total, reservation) => {
      const reservationDate = reservation.start_date ? new Date(reservation.start_date) : null
      if (!reservationDate) return total
      if (reservationDate.getMonth() !== month || reservationDate.getFullYear() !== year) return total
      return total + Number(reservation.amount || 0)
    }, 0)
  }, [reservations])

  const bookingTrend = useMemo(() => {
    const trend = []

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - index)
      const key = formatDateKey(date)
      const bookings = reservations.filter((reservation) => formatDateKey(reservation.created_at) === key || formatDateKey(reservation.start_date) === key).length

      trend.push({
        day: date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
        bookings,
      })
    }

    return trend
  }, [language, reservations])

  const upcomingCheckouts = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.status === 'active' && reservation.end_date)
      .sort((left, right) => new Date(left.end_date) - new Date(right.end_date))
      .slice(0, 3)
      .map((reservation) => {
        const customer = customerMap.get(reservation.client_id)
        const room = roomMap.get(reservation.room_id)

        return {
          id: reservation.id,
          guest: customer?.name || t('reservation_unknown_customer'),
          room: room?.number || t('reservation_unknown_room'),
          time: formatDateShort(reservation.end_date, language),
        }
      })
  }, [customerMap, language, reservations, roomMap, t])

  const recentReservations = useMemo(() => {
    return reservations
      .slice()
      .sort((left, right) => new Date(right.created_at || right.start_date) - new Date(left.created_at || left.start_date))
      .slice(0, 4)
      .map((reservation) => {
        const customer = customerMap.get(reservation.client_id)
        const room = roomMap.get(reservation.room_id)

        return {
          id: reservation.id,
          guest: customer?.name || t('reservation_unknown_customer'),
          room: room?.number || t('reservation_unknown_room'),
          dates: `${formatDateShort(reservation.start_date, language)} – ${formatDateShort(reservation.end_date, language)}`,
          status: reservation.status,
        }
      })
  }, [customerMap, language, reservations, roomMap, t])

  const recentActivity = useMemo(() => {
    const latestReservations = reservations
      .slice()
      .sort((left, right) => new Date(right.created_at || right.start_date) - new Date(left.created_at || left.start_date))
      .slice(0, 3)

    const reservationActivity = latestReservations.map((reservation) => {
      const customer = customerMap.get(reservation.client_id)
      const room = roomMap.get(reservation.room_id)

      return {
        id: reservation.id,
        text: `${customer?.name || t('reservation_unknown_customer')} booked ${room?.number || t('reservation_unknown_room')}`,
        time: formatRelativeLabel(reservation.created_at || reservation.start_date),
      }
    })

    const roomActivity = rooms
      .filter((room) => ['maintenance', 'out_of_service'].includes(room.status))
      .slice(0, 2)
      .map((room) => ({
        id: room.id,
        text: `${room.number} marked ${room.status}`,
        time: 'Updated',
      }))

    return [...reservationActivity, ...roomActivity].slice(0, 4)
  }, [customerMap, reservations, roomMap, rooms, t])

  const name = user?.user_metadata?.name?.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="dash">
        <div className="dash-empty">
          <h2>{t('reservation_loading')}</h2>
          <p>{t('dashboard_subtitle')}</p>
        </div>
      </div>
    )
  }

  if (dashboardError) {
    return (
      <div className="dash">
        <div className="dash-empty">
          <h2>{t('reservation_error_title')}</h2>
          <p>{dashboardError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dash">
      <div className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-content">
          <h1>{t('welcome_back')}{name ? `, ${name}` : ''}</h1>
          <p className="dash-subtitle">{today} — {t('dashboard_subtitle')}</p>
          <div className="dash-hero-summary">
            <span><LogIn size={14} /> {todaySummary.checkIns} check-ins today</span>
            <span><LogOut size={14} /> {todaySummary.checkOuts} check-outs today</span>
            <span><CalendarPlus size={14} /> {todaySummary.newReservations} new reservations</span>
          </div>
        </div>
      </div>

      <div className="dash-kpis">
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-primary"><TrendingUp size={18} /></div>
          <div className="kpi-value">{Math.round(occupancyRate * 100)}%</div>
          <div className="kpi-label">Occupancy Rate</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-success"><Wallet size={18} /></div>
          <div className="kpi-value">{formatCurrency(revenueThisMonth, language)} </div>
          <div className="kpi-label">Revenue this month</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-neutral"><BedDouble size={18} /></div>
          <div className="kpi-value">{availableCount}</div>
          <div className="kpi-label">{t('stat_available')} rooms</div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon kpi-icon-warning"><LogOut size={18} /></div>
          <div className="kpi-value">{todaySummary.checkOuts}</div>
          <div className="kpi-label">Check-outs today</div>
        </Card>
      </div>

      <div className="dash-row">
        <Card className="dash-panel dash-panel-chart">
          <h3>Booking Analytics — Last 7 days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bookingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13 }} />
              <Line type="monotone" dataKey="bookings" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dash-panel">
          <h3>Upcoming Check-outs</h3>
          <div className="dash-list">
            {upcomingCheckouts.map((checkout) => (
              <div key={checkout.id} className="checkout-item">
                <div className="checkout-avatar">{checkout.guest.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>
                <div className="checkout-info">
                  <div className="checkout-name">{checkout.guest}</div>
                  <div className="checkout-meta">Room {checkout.room} · {checkout.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dash-row">
        <Card className="dash-panel dash-panel-wide">
          <h3>{t('recent_reservations')}</h3>
          <table className="dash-table">
            <thead>
              <tr><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.guest}</td>
                  <td className="mono">{reservation.room}</td>
                  <td>{reservation.dates}</td>
                  <td><Badge status={getBadgeStatus(reservation.status)}>{reservation.status}</Badge></td>
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-dot" />
                  <div>
                    <div className="activity-text">{activity.text}</div>
                    <div className="activity-time">{activity.time}</div>
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
