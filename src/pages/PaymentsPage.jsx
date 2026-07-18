import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useLanguage } from '../hooks/useLanguage'
import { paymentsService } from '../services/payments.service'
import { reservationsService } from '../services/reservations.service'
import './PaymentsPage.css'

const EMPTY_FORM = {
  reservation_id: '',
  amount: '',
  payment_date: '',
  payment_method: '',
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

export default function PaymentsPage() {
  const { language, t } = useLanguage()
  const [payments, setPayments] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [paymentData, reservationData] = await Promise.all([
        paymentsService.getAll(),
        reservationsService.getAll(),
      ])

      setPayments(paymentData || [])
      setReservations(reservationData || [])
    } catch (err) {
      setError(err?.message || 'Unable to load payments.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingPayment(null)
    setForm({ ...EMPTY_FORM, payment_date: new Date().toISOString().slice(0, 10) })
    setFeedback(null)
    setFormOpen(true)
  }

  function openEditForm(payment) {
    setEditingPayment(payment)
    setForm({
      reservation_id: payment.reservation_id || '',
      amount: payment.amount ?? '',
      payment_date: payment.payment_date || '',
      payment_method: payment.payment_method || '',
    })
    setFeedback(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingPayment(null)
    setForm(EMPTY_FORM)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.reservation_id || !form.amount || !form.payment_date) {
      setError('Please fill in the reservation, amount, and payment date.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (editingPayment) {
        await paymentsService.update(editingPayment.id, form)
        setFeedback({ type: 'success', text: 'Payment updated successfully.' })
      } else {
        await paymentsService.create(form)
        setFeedback({ type: 'success', text: 'Payment recorded successfully.' })
      }

      await loadData()
      closeForm()
    } catch (err) {
      setError(err?.message || 'Unable to save payment.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(payment) {
    if (!globalThis.confirm('Delete this payment record?')) return

    try {
      await paymentsService.remove(payment.id)
      setFeedback({ type: 'success', text: 'Payment deleted successfully.' })
      await loadData()
    } catch (err) {
      setError(err?.message || 'Unable to delete payment.')
    }
  }

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const latest = payments.reduce((max, payment) => (Number(payment.amount || 0) > Number(max.amount || 0) ? payment : max), payments[0] || {})

    return {
      count: payments.length,
      totalAmount,
      largestAmount: latest?.amount || 0,
    }
  }, [payments])

  const filteredPayments = useMemo(() => {
    const query = String(search || '').trim().toLocaleLowerCase()

    return payments.filter((payment) => {
      const reservation = reservations.find((item) => item.id === payment.reservation_id)
      const client = reservation?.clients || null
      const haystack = [
        client?.name || '',
        reservation?.rooms?.number || '',
        payment.payment_method || '',
        payment.amount || '',
        payment.payment_date || '',
      ].join(' ').toLocaleLowerCase()

      return !query || haystack.includes(query)
    })
  }, [payments, reservations, search])

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <div className="payments-kicker">
            <CreditCard size={16} />
            Payments
          </div>
          <h1>Payment management</h1>
          <p>Track payments linked to each reservation and keep your financial records accurate.</p>
        </div>

        <div className="payments-header-actions">
          <Button onClick={openCreateForm}>
            <Plus size={16} /> Record payment
          </Button>
        </div>
      </div>

      <div className="payments-stats">
        <div className="payment-stat">
          <span>Total payments</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="payment-stat">
          <span>Total collected</span>
          <strong>{formatCurrency(stats.totalAmount, language)}</strong>
        </div>
        <div className="payment-stat">
          <span>Largest payment</span>
          <strong>{formatCurrency(stats.largestAmount, language)}</strong>
        </div>
      </div>

      {feedback && <Alert type="success">{feedback.text}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {formOpen && (
        <Card className="payments-form-card">
          <div className="payments-form-header">
            <div>
              <h2>{editingPayment ? 'Edit payment' : 'Record a new payment'}</h2>
              <p>Connect a payment to a reservation using the existing booking data.</p>
            </div>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payments-form-grid">
              <div className="payments-field">
                <label>Reservation</label>
                <select name="reservation_id" value={form.reservation_id} onChange={handleFormChange} required>
                  <option value="">Select reservation</option>
                  {reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.clients?.name || 'Unknown client'} — Room {reservation.rooms?.number || reservation.room_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payments-field">
                <label>Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={handleFormChange} min="0" step="1000" required />
              </div>

              <div className="payments-field">
                <label>Payment date</label>
                <input type="date" name="payment_date" value={form.payment_date} onChange={handleFormChange} required />
              </div>

              <div className="payments-field">
                <label>Payment method</label>
                <input type="text" name="payment_method" value={form.payment_method} onChange={handleFormChange} placeholder="Cash, card, transfer..." />
              </div>

              <div className="payments-form-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingPayment ? 'Save changes' : 'Record payment'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card className="payments-table-card">
        <div className="payments-toolbar">
          <div className="payments-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, room, method..."
            />
          </div>
        </div>

        {loading ? (
          <div className="payments-empty">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="payments-empty">No payments found.</div>
        ) : (
          <div className="payments-table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Reservation</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const reservation = reservations.find((item) => item.id === payment.reservation_id)
                  const client = reservation?.clients || null

                  return (
                    <tr key={payment.id}>
                      <td className="payment-customer">
                        <strong>{client?.name || 'Unknown client'}</strong>
                        <small>{reservation?.rooms?.number ? `Room ${reservation.rooms.number}` : 'No room linked'}</small>
                      </td>
                      <td className="payment-reservation">
                        <strong>{reservation?.id ? `Reservation #${reservation.id.slice(0, 8)}` : 'Unlinked reservation'}</strong>
                        <small>{reservation?.start_date && reservation?.end_date ? `${formatDate(reservation.start_date, language)} → ${formatDate(reservation.end_date, language)}` : 'No dates'}</small>
                      </td>
                      <td className="payment-amount">{formatCurrency(payment.amount, language)}</td>
                      <td><span className="payment-method-pill">{payment.payment_method || 'Unspecified'}</span></td>
                      <td className="payment-date">
                        <strong>{formatDate(payment.payment_date, language)}</strong>
                        <small>{payment.created_at ? `Recorded ${formatDate(payment.created_at, language)}` : ''}</small>
                      </td>
                      <td>
                        <div className="payment-actions">
                          <button type="button" className="payment-action-edit" onClick={() => openEditForm(payment)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button type="button" className="payment-action-delete" onClick={() => handleDelete(payment)}>
                            <Trash2 size={14} /> Delete
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
    </div>
  )
}