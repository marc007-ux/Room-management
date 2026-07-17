import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Home,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useLanguage } from '../hooks/useLanguage'
import { customersService } from '../services/customers.service'
import { reservationsService } from '../services/reservations.service'
import { roomsService } from '../services/rooms.service'
import './ReservationsPage.css'

const EMPTY_FORM = {
  client_id: '',
  room_id: '',
  start_date: '',
  end_date: '',
  amount: '',
  status: 'active',
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function formatCurrency(value, language) {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`
}

function formatDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
}

function getReservationStatusLabel(status, t) {
  const labels = {
    active: t('reservation_status_active'),
    completed: t('reservation_status_completed'),
    cancelled: t('reservation_status_cancelled'),
  }

  return labels[status] || status
}

function getReservationErrorMessage(err, t) {
  const message = err?.message || ''
  const normalized = message.toLocaleLowerCase()

  if (normalized.includes('row-level security')) return t('reservation_auth_required')
  if (normalized.includes('overlap')) return t('reservation_overlap_error')
  if (normalized.includes('not available')) return t('reservation_overlap_error')
  return message || t('reservation_error_title')
}

export default function ReservationsPage() {
  const { language, t } = useLanguage()
  const [reservations, setReservations] = useState([])
  const [customers, setCustomers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionInFlight, setActionInFlight] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [reservationData, customerData, roomData] = await Promise.all([
        reservationsService.getAll(),
        customersService.getAll(),
        roomsService.getAll(),
      ])

      setReservations(reservationData || [])
      setCustomers(customerData || [])
      setRooms(roomData || [])
    } catch (err) {
      setError(getReservationErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingReservation(null)
    setForm({ ...EMPTY_FORM, amount: '' })
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function openEditForm(reservation) {
    setEditingReservation(reservation)
    setForm({
      client_id: reservation.client_id || '',
      room_id: reservation.room_id || '',
      start_date: reservation.start_date || '',
      end_date: reservation.end_date || '',
      amount: reservation.amount ?? '',
      status: reservation.status || 'active',
    })
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingReservation(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function validateForm() {
    if (!form.client_id) return t('reservation_client_required')
    if (!form.room_id) return t('reservation_room_required')
    if (!form.start_date || !form.end_date) return t('reservation_dates_required')
    if (new Date(form.end_date) <= new Date(form.start_date)) return t('reservation_dates_invalid')
    if (Number(form.amount) < 0 || Number.isNaN(Number(form.amount))) return t('reservation_amount_invalid')
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingReservation) {
        await reservationsService.update(editingReservation.id, form)
        setFeedback({ type: 'success', text: t('reservation_update_success') })
      } else {
        await reservationsService.create(form)
        setFeedback({ type: 'success', text: t('reservation_create_success') })
      }

      await loadData()
      closeForm()
    } catch (err) {
      setFormError(getReservationErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAction(action, reservation) {
    setActionInFlight(action + reservation.id)

    try {
      if (action === 'checkin') {
        await reservationsService.checkIn(reservation.id)
        setFeedback({ type: 'success', text: t('reservation_checkin_success') })
      } else if (action === 'checkout') {
        await reservationsService.checkOut(reservation.id)
        setFeedback({ type: 'success', text: t('reservation_checkout_success') })
      } else if (action === 'cancel') {
        await reservationsService.cancel(reservation.id)
        setFeedback({ type: 'success', text: t('reservation_cancel_success') })
      } else if (action === 'extend') {
        const nextEndDate = globalThis.prompt(t('reservation_extend_prompt'))
        if (!nextEndDate) return
        await reservationsService.extend(reservation.id, nextEndDate)
        setFeedback({ type: 'success', text: t('reservation_extend_success') })
      }

      await loadData()
    } catch (err) {
      setFeedback({ type: 'error', text: getReservationErrorMessage(err, t) })
    } finally {
      setActionInFlight(null)
    }
  }

  async function handleViewHistory(reservation) {
    try {
      const data = await reservationsService.getHistory(reservation.client_id, reservation.room_id)
      setHistory(data || [])
      setHistoryTarget(reservation)
    } catch (err) {
      setFeedback({ type: 'error', text: getReservationErrorMessage(err, t) })
    }
  }

  const stats = useMemo(() => {
    const counts = reservations.reduce(
      (acc, reservation) => {
        acc.total += 1
        acc[reservation.status] = (acc[reservation.status] || 0) + 1
        return acc
      },
      { total: 0, active: 0, completed: 0, cancelled: 0 },
    )

    return counts
  }, [reservations])

  const filteredReservations = useMemo(() => {
    const query = normalize(search)

    return reservations.filter((reservation) => {
      const customer = customers.find((item) => item.id === reservation.client_id)
      const room = rooms.find((item) => item.id === reservation.room_id)
      const haystack = normalize(
        `${customer?.name || ''} ${room?.number || ''} ${reservation.status || ''} ${reservation.amount || ''}`,
      )
      const matchesSearch = !query || haystack.includes(query)
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [customers, reservations, rooms, search, statusFilter])

  return (
    <div className="reservations-page">
      <div className="reservations-header">
        <div>
          <div className="reservations-kicker">
            <CalendarDays size={16} />
            {t('nav_reservations')}
          </div>
          <h1>{t('reservations_title')}</h1>
          <p>{t('reservations_subtitle')}</p>
        </div>

        <div className="reservations-header-actions">
          <Button variant="primary" onClick={openCreateForm}>
            <Plus size={16} />
            {t('reservations_add')}
          </Button>
        </div>
      </div>

      <div className="reservations-stats">
        <div className="reservation-stat">
          <span>{t('reservations_total')}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="reservation-stat">
          <span>{t('reservation_stat_active')}</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="reservation-stat">
          <span>{t('reservation_stat_completed')}</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="reservation-stat">
          <span>{t('reservation_stat_cancelled')}</span>
          <strong>{stats.cancelled}</strong>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {formOpen && (
        <div className="reservation-modal-backdrop" role="presentation">
          <div className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-form-title">
            <div className="reservation-modal-header">
              <div>
                <span>{t('nav_reservations')}</span>
                <h2 id="reservation-form-title">
                  {editingReservation ? t('reservation_form_edit_title') : t('reservation_form_create_title')}
                </h2>
              </div>
              <button className="room-icon-btn" type="button" onClick={closeForm} title={t('reservation_cancel')}>
                <X size={18} />
              </button>
            </div>

            {formError && <Alert type="error">{formError}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="reservation-form-grid">
                <label className="room-select-field">
                  <span>{t('reservation_customer_label')}</span>
                  <select name="client_id" value={form.client_id} onChange={handleFormChange}>
                    <option value="">{t('reservation_customer_placeholder')}</option>
                    {customers.map((customer) => (
                      <option value={customer.id} key={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-select-field">
                  <span>{t('reservation_room_label')}</span>
                  <select name="room_id" value={form.room_id} onChange={handleFormChange}>
                    <option value="">{t('reservation_room_placeholder')}</option>
                    {rooms.map((room) => (
                      <option value={room.id} key={room.id}>
                        {room.number}
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  label={t('reservation_start_label')}
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleFormChange}
                />

                <Input
                  label={t('reservation_end_label')}
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleFormChange}
                />

                <Input
                  label={t('reservation_amount_label')}
                  name="amount"
                  type="number"
                  min="0"
                  step="100"
                  value={form.amount}
                  onChange={handleFormChange}
                />

                <label className="room-select-field">
                  <span>{t('reservation_status_label')}</span>
                  <select name="status" value={form.status} onChange={handleFormChange}>
                    <option value="active">{t('reservation_status_active')}</option>
                    <option value="completed">{t('reservation_status_completed')}</option>
                    <option value="cancelled">{t('reservation_status_cancelled')}</option>
                  </select>
                </label>
              </div>

              <div className="reservation-modal-actions">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  {t('reservation_cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('reservation_loading') : editingReservation ? t('reservation_save') : t('reservation_create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <div className="reservations-toolbar">
          <div className="reservations-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('reservations_search_placeholder')}
            />
          </div>

          <div className="reservations-filter">
            <Home size={18} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t('reservation_filter_all')}</option>
              <option value="active">{t('reservation_status_active')}</option>
              <option value="completed">{t('reservation_status_completed')}</option>
              <option value="cancelled">{t('reservation_status_cancelled')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="reservations-loading">
            <p>{t('reservation_loading')}</p>
          </div>
        ) : error ? (
          <div className="reservations-empty">
            <div className="reservations-empty-icon">
              <CalendarDays size={24} />
            </div>
            <h2>{t('reservation_error_title')}</h2>
            <p>{error}</p>
            <Button variant="primary" onClick={loadData}>
              {t('reservation_retry')}
            </Button>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="reservations-empty">
            <div className="reservations-empty-icon">
              <CalendarDays size={24} />
            </div>
            <h2>{t('reservations_no_results_title')}</h2>
            <p>{t('reservations_no_results_text')}</p>
            <Button variant="primary" onClick={openCreateForm}>
              <Plus size={16} />
              {t('reservations_add')}
            </Button>
          </div>
        ) : (
          <div className="reservations-table-wrapper">
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>{t('reservation_table_customer')}</th>
                  <th>{t('reservation_table_room')}</th>
                  <th>{t('reservation_table_dates')}</th>
                  <th>{t('reservation_table_amount')}</th>
                  <th>{t('reservation_table_status')}</th>
                  <th>{t('reservation_table_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  const customer = customers.find((item) => item.id === reservation.client_id)
                  const room = rooms.find((item) => item.id === reservation.room_id)
                  const isActive = reservation.status === 'active'

                  return (
                    <tr key={reservation.id}>
                      <td className="reservation-client-cell">
                        <strong>{customer?.name || t('reservation_unknown_customer')}</strong>
                        <small>{customer?.phone || ''}</small>
                      </td>
                      <td className="reservation-room-cell">
                        <strong>{room?.number || t('reservation_unknown_room')}</strong>
                        <small>{room?.status || ''}</small>
                      </td>
                      <td className="reservation-date-cell">
                        <strong>{formatDate(reservation.start_date, language)}</strong>
                        <small>{formatDate(reservation.end_date, language)}</small>
                      </td>
                      <td className="reservation-amount">{formatCurrency(reservation.amount, language)}</td>
                      <td>
                        <span className={`reservation-status-pill reservation-status-${reservation.status}`}>
                          {getReservationStatusLabel(reservation.status, t)}
                        </span>
                      </td>
                      <td>
                        <div className="reservation-actions">
                          <button className="reservation-action-primary" type="button" onClick={() => openEditForm(reservation)}>
                            <Pencil size={14} />
                            {t('reservation_edit')}
                          </button>
                          <button className="reservation-action-accent" type="button" onClick={() => handleAction('checkin', reservation)} disabled={actionInFlight === 'checkin' + reservation.id || !isActive}>
                            <Clock3 size={14} />
                            {t('reservation_checkin')}
                          </button>
                          <button className="reservation-action-neutral" type="button" onClick={() => handleAction('checkout', reservation)} disabled={actionInFlight === 'checkout' + reservation.id || !isActive}>
                            <ChevronRight size={14} />
                            {t('reservation_checkout')}
                          </button>
                          <button className="reservation-action-danger" type="button" onClick={() => handleAction('cancel', reservation)} disabled={actionInFlight === 'cancel' + reservation.id || !isActive}>
                            <Trash2 size={14} />
                            {t('reservation_cancel')}
                          </button>
                          <button className="reservation-action-neutral" type="button" onClick={() => handleAction('extend', reservation)} disabled={actionInFlight === 'extend' + reservation.id || !isActive}>
                            <CreditCard size={14} />
                            {t('reservation_extend')}
                          </button>
                          <button className="reservation-action-neutral" type="button" onClick={() => handleViewHistory(reservation)}>
                            <Eye size={14} />
                            {t('reservation_history')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {historyTarget && (
        <div className="reservation-modal-backdrop" role="presentation">
          <div className="reservation-modal reservation-modal-small" role="dialog" aria-modal="true" aria-labelledby="reservation-history-title">
            <div className="reservation-modal-header">
              <div>
                <span>{t('reservation_history')}</span>
                <h2 id="reservation-history-title">{t('reservation_history_title')}</h2>
              </div>
              <button className="room-icon-btn" type="button" onClick={() => setHistoryTarget(null)} title={t('reservation_cancel')}>
                <X size={18} />
              </button>
            </div>

            <div className="reservation-history-list">
              {history.length === 0 ? (
                <div className="reservation-history-item">
                  <strong>{t('reservation_history_empty')}</strong>
                  <p>{t('reservation_history_empty_text')}</p>
                </div>
              ) : (
                history.map((item) => (
                  <div className="reservation-history-item" key={item.id}>
                    <strong>{item.room?.number || t('reservation_unknown_room')}</strong>
                    <p>
                      {formatDate(item.start_date, language)} - {formatDate(item.end_date, language)} ·{' '}
                      {getReservationStatusLabel(item.status, t)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

