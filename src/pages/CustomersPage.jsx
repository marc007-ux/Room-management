import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  UserSquare2,
  X,
} from 'lucide-react'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useLanguage } from '../hooks/useLanguage'
import { customersService } from '../services/customers.service'
import './CustomersPage.css'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  identification: '',
  address: '',
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function getCustomerErrorMessage(err, t) {
  const message = err?.message || ''
  const normalized = message.toLocaleLowerCase()

  if (normalized.includes('row-level security')) return t('customer_auth_required')
  return message || t('customer_error_title')
}

export default function CustomersPage() {
  const { language, t } = useLanguage()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    setError(null)

    try {
      const data = await customersService.getAll()
      setCustomers(data || [])
    } catch (err) {
      setError(getCustomerErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingCustomer(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function openEditForm(customer) {
    setEditingCustomer(customer)
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      identification: customer.identification || '',
      address: customer.address || '',
    })
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCustomer(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function validateForm() {
    if (!form.name.trim()) return t('customer_name_required')
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return t('customer_email_invalid')
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
      if (editingCustomer) {
        await customersService.update(editingCustomer.id, form)
        setFeedback({ type: 'success', text: t('customer_update_success') })
      } else {
        await customersService.create(form)
        setFeedback({ type: 'success', text: t('customer_create_success') })
      }

      await loadCustomers()
      closeForm()
    } catch (err) {
      setFormError(getCustomerErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(customer) {
    const confirmed = globalThis.confirm(t('customer_delete_confirm_message', { name: customer.name }))

    if (!confirmed) return

    setDeletingId(customer.id)

    try {
      await customersService.remove(customer.id)
      setCustomers((current) => current.filter((item) => item.id !== customer.id))
      setFeedback({ type: 'success', text: t('customer_delete_success') })
    } catch (err) {
      setFeedback({ type: 'error', text: getCustomerErrorMessage(err, t) })
    } finally {
      setDeletingId(null)
    }
  }

  const stats = useMemo(() => {
    const counts = customers.reduce(
      (acc, customer) => {
        acc.total += 1
        acc.email = acc.email + Number(Boolean(customer.email))
        acc.phone = acc.phone + Number(Boolean(customer.phone))
        acc.identification = acc.identification + Number(Boolean(customer.identification))
        return acc
      },
      { total: 0, email: 0, phone: 0, identification: 0 },
    )

    return counts
  }, [customers])

  const filteredCustomers = useMemo(() => {
    const query = normalize(search)

    return customers.filter((customer) => {
      const haystack = normalize(
        `${customer.name || ''} ${customer.phone || ''} ${customer.email || ''} ${customer.identification || ''} ${customer.address || ''}`,
      )
      const matchesSearch = !query || haystack.includes(query)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'email' && Boolean(customer.email)) ||
        (filter === 'phone' && Boolean(customer.phone)) ||
        (filter === 'id' && Boolean(customer.identification))

      return matchesSearch && matchesFilter
    })
  }, [customers, filter, search])

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <div className="customers-kicker">
            <Building2 size={16} />
            {t('nav_customers')}
          </div>
          <h1>{t('customers_title')}</h1>
          <p>{t('customers_subtitle')}</p>
        </div>

        <div className="customers-header-actions">
          <Button variant="primary" onClick={openCreateForm}>
            <Plus size={16} />
            {t('customers_add')}
          </Button>
        </div>
      </div>

      <div className="customers-stats">
        <div className="customer-stat">
          <span>{t('customers_total')}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="customer-stat">
          <span>{t('customers_with_email')}</span>
          <strong>{stats.email}</strong>
        </div>
        <div className="customer-stat">
          <span>{t('customers_with_phone')}</span>
          <strong>{stats.phone}</strong>
        </div>
        <div className="customer-stat">
          <span>{t('customers_with_id')}</span>
          <strong>{stats.identification}</strong>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {formOpen && (
        <Card className="customer-form-card">
          <div className="customer-form-header">
            <div>
              <h2>{editingCustomer ? t('customer_form_edit_title') : t('customer_form_create_title')}</h2>
              <p>{editingCustomer ? t('customer_form_edit_subtitle') : t('customer_form_create_subtitle')}</p>
            </div>
            <Button variant="secondary" onClick={closeForm}>
              <X size={16} />
              {t('customer_cancel')}
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="customer-form-grid">
              <Input
                label={t('customer_name_label')}
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder={t('customer_name_placeholder')}
                required
              />
              <Input
                label={t('customer_phone_label')}
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder={t('customer_phone_placeholder')}
              />
              <Input
                label={t('customer_email_label')}
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder={t('customer_email_placeholder')}
                error={formError && formError.includes('email') ? formError : undefined}
              />
              <Input
                label={t('customer_identification_label')}
                name="identification"
                value={form.identification}
                onChange={handleFormChange}
                placeholder={t('customer_identification_placeholder')}
              />
              <Input
                label={t('customer_address_label')}
                name="address"
                value={form.address}
                onChange={handleFormChange}
                placeholder={t('customer_address_placeholder')}
              />
              <div className="customer-form-actions">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  {t('customer_cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {editingCustomer ? t('customer_save') : t('customer_create')}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="customers-toolbar">
          <div className="customers-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('customers_search_placeholder')}
            />
          </div>

          <div className="customers-filter">
            <UserSquare2 size={18} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">{t('customers_filter_all')}</option>
              <option value="email">{t('customers_filter_email')}</option>
              <option value="phone">{t('customers_filter_phone')}</option>
              <option value="id">{t('customers_filter_id')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="customers-loading">
            <p>{t('customer_loading')}</p>
          </div>
        ) : error ? (
          <div className="customers-empty">
            <div className="customers-empty-icon">
              <UserRound size={24} />
            </div>
            <h2>{t('customer_error_title')}</h2>
            <p>{error}</p>
            <Button variant="primary" onClick={loadCustomers}>
              {t('customer_retry')}
            </Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="customers-empty">
            <div className="customers-empty-icon">
              <UserRound size={24} />
            </div>
            <h2>{t('customers_no_results_title')}</h2>
            <p>{t('customers_no_results_text')}</p>
            <Button variant="primary" onClick={openCreateForm}>
              <Plus size={16} />
              {t('customers_add')}
            </Button>
          </div>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>{t('customer_table_name')}</th>
                  <th>{t('customer_table_contact')}</th>
                  <th>{t('customer_table_identification')}</th>
                  <th>{t('customer_table_address')}</th>
                  <th>{t('customer_table_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="customer-name-cell">
                      <strong>{customer.name}</strong>
                      <small>{customer.created_at ? new Date(customer.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : ''}</small>
                    </td>
                    <td>
                      <div className="customer-info">
                        {customer.phone ? (
                          <div className="customer-pill">
                            <Phone size={14} />
                            {customer.phone}
                          </div>
                        ) : null}
                        {customer.email ? (
                          <div className="customer-pill" style={{ marginTop: '8px' }}>
                            <Mail size={14} />
                            {customer.email}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {customer.identification ? (
                        <span className="customer-pill">{customer.identification}</span>
                      ) : (
                        <span className="customer-info">{t('customer_table_no_id')}</span>
                      )}
                    </td>
                    <td>
                      <span className="customer-info">{customer.address || t('customer_table_no_address')}</span>
                    </td>
                    <td>
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="customer-action-edit"
                          onClick={() => openEditForm(customer)}
                          aria-label={t('customer_edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="customer-action-delete"
                          onClick={() => handleDelete(customer)}
                          disabled={deletingId === customer.id}
                          aria-label={t('customer_delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

