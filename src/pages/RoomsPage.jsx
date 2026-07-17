import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BedDouble,
  Check,
  ChevronDown,
  DoorOpen,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useCategories } from '../hooks/useCategories'
import { useLanguage } from '../hooks/useLanguage'
import { useRooms } from '../hooks/useRooms'
import './RoomsPage.css'

const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'maintenance', 'out_of_service']
const EMPTY_FORM = {
  number: '',
  category_id: '',
  description: '',
  floor: '',
  capacity: '',
  price: '',
  status: 'available',
}
const SHOW_TEST_ROOM_ACTION = false

const STATUS_LABELS = {
  en: {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
    out_of_service: 'Out of service',
  },
  fr: {
    available: 'Disponible',
    reserved: 'Réservée',
    occupied: 'Occupée',
    maintenance: 'Maintenance',
    out_of_service: 'Hors service',
  },
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function getCategoryName(category, language) {
  if (!category) return ''
  if (language === 'fr') return category.name || category.name_en || ''
  return category.name_en || category.name || ''
}

function formatCurrency(value, language) {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const amount = Number(value || 0)

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)} FCFA`
}

function numbersMatch(valueA, valueB) {
  return Number(valueA || 0) === Number(valueB || 0)
}

function getStatusLabel(status, language) {
  return STATUS_LABELS[language]?.[status] || STATUS_LABELS.en[status] || status
}

function getRoomErrorMessage(err, t) {
  const message = err?.message || ''
  const normalized = message.toLocaleLowerCase()

  if (normalized.includes('row-level security')) return t('room_auth_required')
  if (normalized.includes('duplicate key') || normalized.includes('rooms_number_key')) {
    return t('room_duplicate_number')
  }

  return message || t('room_error_title')
}

function FilterDropdown({ label, options, value, onChange, variant = 'filter' }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const selectedOption = options.find((option) => option.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(nextValue) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div
      className={`room-filter-menu room-filter-menu-${variant} ${open ? 'room-filter-menu-open' : ''}`}
      ref={menuRef}
    >
      {variant === 'form' && <span className="room-filter-field-label">{label}</span>}
      <button
        className="room-filter-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {variant !== 'form' && <span>{label}</span>}
        <strong>{selectedOption?.label}</strong>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="room-filter-popover" role="listbox">
          {options.map((option) => (
            <button
              className={`room-filter-option ${option.value === value ? 'room-filter-option-active' : ''}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusDropdown({ value, language, disabled, onChange }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const selectedLabel = getStatusLabel(value, language)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(status) {
    onChange(status)
    setOpen(false)
  }

  return (
    <div className={`room-status-menu ${open ? 'room-status-menu-open' : ''}`} ref={menuRef}>
      <button
        className="room-status-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Badge status={value}>{selectedLabel}</Badge>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="room-status-popover" role="listbox">
          {ROOM_STATUSES.map((status) => (
            <button
              className={`room-status-option ${status === value ? 'room-status-option-active' : ''}`}
              key={status}
              type="button"
              role="option"
              aria-selected={status === value}
              onClick={() => handleSelect(status)}
            >
              <Badge status={status}>{getStatusLabel(status, language)}</Badge>
              {status === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RoomsPage() {
  const { language, t } = useLanguage()
  const {
    rooms,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    seedTestRooms,
  } = useRooms()
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  const [feedback, setFeedback] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [priceMode, setPriceMode] = useState('inherited')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [seedingRooms, setSeedingRooms] = useState(false)

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]))
  }, [categories])

  const stats = useMemo(() => {
    const counts = rooms.reduce(
      (acc, room) => {
        acc.total += 1
        acc[room.status] = (acc[room.status] || 0) + 1
        return acc
      },
      { total: 0 },
    )

    return {
      total: counts.total,
      available: counts.available || 0,
      active: (counts.reserved || 0) + (counts.occupied || 0),
      attention: (counts.maintenance || 0) + (counts.out_of_service || 0),
    }
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const query = normalize(search)

    return rooms
      .filter((room) => {
        const category = room.categories || categoriesById.get(room.category_id)
        const haystack = normalize(
          `${room.number} ${room.description || ''} ${getCategoryName(category, language)}`,
        )
        const matchesSearch = !query || haystack.includes(query)
        const matchesStatus = statusFilter === 'all' || room.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || room.category_id === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((roomA, roomB) =>
        String(roomA.number).localeCompare(String(roomB.number), undefined, { numeric: true }),
      )
  }, [categoriesById, categoryFilter, language, rooms, search, statusFilter])

  function getSelectedCategory(categoryId = form.category_id) {
    return categoriesById.get(categoryId) || null
  }

  function getInitialForm() {
    const category = categories[0]

    return {
      ...EMPTY_FORM,
      category_id: category?.id || '',
      price: category ? String(category.default_price ?? 0) : '',
    }
  }

  function openCreateForm() {
    if (categories.length === 0) {
      setFeedback({ type: 'error', text: t('rooms_missing_categories') })
      return
    }

    setEditingRoom(null)
    setForm(getInitialForm())
    setPriceMode('inherited')
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function openEditForm(room) {
    const category = room.categories || categoriesById.get(room.category_id)
    const categoryPrice = category?.default_price ?? 0

    setEditingRoom(room)
    setForm({
      number: room.number || '',
      category_id: room.category_id || '',
      description: room.description || '',
      floor: room.floor ?? '',
      capacity: room.capacity ?? '',
      price: String(room.price ?? 0),
      status: room.status || 'available',
    })
    setPriceMode(numbersMatch(room.price, categoryPrice) ? 'inherited' : 'custom')
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingRoom(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setPriceMode('inherited')
  }

  function handleCategoryChange(categoryId) {
    const category = getSelectedCategory(categoryId)
    setForm({
      ...form,
      category_id: categoryId,
      price: category ? String(category.default_price ?? 0) : '',
    })
    setPriceMode('inherited')
  }

  function handlePriceChange(price) {
    const category = getSelectedCategory()
    setForm({ ...form, price })
    setPriceMode(category && numbersMatch(price, category.default_price) ? 'inherited' : 'custom')
  }

  function applyCategoryPrice() {
    const category = getSelectedCategory()
    if (!category) return

    setForm({ ...form, price: String(category.default_price ?? 0) })
    setPriceMode('inherited')
  }

  function validateForm() {
    if (!form.number.trim()) return t('room_number_required')
    if (!form.category_id) return t('room_category_required')
    if (Number(form.price) < 0 || Number.isNaN(Number(form.price))) return t('room_price_invalid')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, form)
        setFeedback({ type: 'success', text: t('room_update_success') })
      } else {
        await createRoom(form)
        setFeedback({ type: 'success', text: t('room_create_success') })
      }

      closeForm()
    } catch (err) {
      setFormError(getRoomErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(room, status) {
    setUpdatingStatusId(room.id)
    setFeedback(null)

    try {
      await updateRoomStatus(room.id, status)
    } catch (err) {
      setFeedback({ type: 'error', text: getRoomErrorMessage(err, t) })
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function handleSeedTestRooms() {
    if (categories.length === 0) {
      setFeedback({ type: 'error', text: t('rooms_missing_categories') })
      return
    }

    setSeedingRooms(true)
    setFeedback(null)

    try {
      const inserted = await seedTestRooms(categories)
      setFeedback({
        type: 'success',
        text: inserted.length > 0 ? t('room_seed_success') : t('room_seed_none'),
      })
    } catch (err) {
      const text =
        err.code === 'ROOMS_NEED_CATEGORIES'
          ? t('rooms_missing_categories')
          : getRoomErrorMessage(err, t)

      setFeedback({ type: 'error', text })
    } finally {
      setSeedingRooms(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    setFeedback(null)

    try {
      await deleteRoom(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({ type: 'success', text: t('room_delete_success') })
    } catch (err) {
      const text =
        err.code === 'ROOM_HAS_RESERVATIONS'
          ? t('room_delete_blocked')
          : getRoomErrorMessage(err, t)

      setDeleteTarget(null)
      setFeedback({ type: 'error', text })
    } finally {
      setDeleting(false)
    }
  }

  const selectedCategory = getSelectedCategory()
  const showEmptyState = !loading && rooms.length === 0
  const showNoResults = !loading && rooms.length > 0 && filteredRooms.length === 0
  const statusOptions = [
    { value: 'all', label: t('rooms_filter_all_statuses') },
    ...ROOM_STATUSES.map((status) => ({ value: status, label: getStatusLabel(status, language) })),
  ]
  const categoryOptions = [
    { value: 'all', label: t('rooms_filter_all_categories') },
    ...categories.map((category) => ({
      value: category.id,
      label: getCategoryName(category, language),
    })),
  ]

  return (
    <div className="rooms-page">
      <div className="rooms-header">
        <div>
          <div className="rooms-kicker">
            <DoorOpen size={15} />
            <span>{t('rooms_title')}</span>
          </div>
          <h1>{t('rooms_title')}</h1>
          <p>{t('rooms_subtitle')}</p>
        </div>

        <div className="rooms-header-actions">
          {SHOW_TEST_ROOM_ACTION && (
            <Button variant="secondary" onClick={handleSeedTestRooms} disabled={categoriesLoading || seedingRooms}>
              <Sparkles size={16} />
              {seedingRooms ? t('room_loading') : t('rooms_add_test')}
            </Button>
          )}
          <Button onClick={openCreateForm} disabled={categoriesLoading}>
            <Plus size={16} />
            {t('rooms_add')}
          </Button>
        </div>
      </div>

      <div className="rooms-stats">
        <div className="room-stat">
          <span>{t('rooms_total')}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="room-stat">
          <span>{t('rooms_available')}</span>
          <strong>{stats.available}</strong>
        </div>
        <div className="room-stat">
          <span>{t('rooms_active')}</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="room-stat">
          <span>{t('rooms_attention')}</span>
          <strong>{stats.attention}</strong>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}
      {error && (
        <Alert type="error">
          <strong>{t('room_error_title')}:</strong> {error}
        </Alert>
      )}
      {categoriesError && (
        <Alert type="error">
          <strong>{t('category_error_title')}:</strong> {categoriesError}
        </Alert>
      )}

      <Card className="rooms-toolbar">
        <div className="rooms-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('rooms_search_placeholder')}
          />
        </div>

        <FilterDropdown
          label={t('room_status_label')}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <FilterDropdown
          label={t('room_category_label')}
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </Card>

      {loading ? (
        <Card className="rooms-loading">{t('room_loading')}</Card>
      ) : showEmptyState ? (
        <div className="rooms-empty">
          <div className="rooms-empty-icon">
            <BedDouble size={24} />
          </div>
          <h2>{t('rooms_empty_title')}</h2>
          <p>{t('rooms_empty_text')}</p>
          <div className="rooms-empty-actions">
            {categories.length > 0 ? (
              <Button onClick={openCreateForm}>
                <Plus size={16} />
                {t('rooms_add')}
              </Button>
            ) : (
              <Link to="/categories" className="rooms-category-link">
                <Button type="button">
                  <Layers size={16} />
                  {t('nav_categories')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : showNoResults ? (
        <div className="rooms-empty rooms-empty-compact">
          <h2>{t('rooms_no_results_title')}</h2>
          <p>{t('rooms_no_results_text')}</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map((room) => {
            const category = room.categories || categoriesById.get(room.category_id)
            const categoryName = getCategoryName(category, language) || t('room_no_category')
            const inheritedPrice = category && numbersMatch(room.price, category.default_price)

            return (
              <Card className="room-card" key={room.id}>
                <div className="room-card-top">
                  <div className="room-number-block">
                    <span>{t('room_number_label')}</span>
                    <h2>{room.number}</h2>
                  </div>
                  <Badge status={room.status} />
                </div>

                <div className="room-category">
                  <Layers size={15} />
                  <span>{categoryName}</span>
                </div>

                <p className="room-description">
                  {room.description || t('categories_no_description')}
                </p>

                <div className="room-price-panel">
                  <span>{t('room_price_label')}</span>
                  <strong>{formatCurrency(room.price, language)}</strong>
                  {category && (
                    <small>{inheritedPrice ? t('room_inherited_price') : t('room_custom_price')}</small>
                  )}
                </div>

                <div className="room-meta-grid">
                  <div>
                    <span className="room-meta-label">{t('room_floor_short')}</span>
                    <span>{room.floor ?? t('room_floor_unknown')}</span>
                  </div>
                  <div>
                    <Users size={15} />
                    <span>
                      {room.capacity ? `${room.capacity} ${t('room_capacity_unit')}` : t('room_capacity_unknown')}
                    </span>
                  </div>
                </div>

                <div className="room-card-footer">
                  <StatusDropdown
                    value={room.status}
                    disabled={updatingStatusId === room.id}
                    language={language}
                    onChange={(status) => handleStatusChange(room, status)}
                  />

                  <div className="room-actions">
                    <button className="room-icon-btn" type="button" onClick={() => openEditForm(room)} title={t('room_edit')}>
                      <Pencil size={16} />
                    </button>
                    <button className="room-icon-btn room-icon-btn-danger" type="button" onClick={() => setDeleteTarget(room)} title={t('room_delete')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {formOpen && (
        <div className="room-modal-backdrop" role="presentation">
          <div className="room-modal" role="dialog" aria-modal="true" aria-labelledby="room-form-title">
            <div className="room-modal-header">
              <div>
                <span>{t('rooms_title')}</span>
                <h2 id="room-form-title">
                  {editingRoom ? t('room_form_edit_title') : t('room_form_create_title')}
                </h2>
              </div>
              <button className="room-icon-btn" type="button" onClick={closeForm} title={t('room_cancel')}>
                <X size={18} />
              </button>
            </div>

            {formError && <Alert type="error">{formError}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="room-form-grid">
                <Input
                  label={t('room_number_label')}
                  placeholder={t('room_number_placeholder')}
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />

                <FilterDropdown
                  label={t('room_category_label')}
                  options={categories.map((category) => ({
                    value: category.id,
                    label: getCategoryName(category, language),
                  }))}
                  value={form.category_id}
                  onChange={handleCategoryChange}
                  variant="form"
                />
              </div>

              <label className="room-textarea-field">
                <span>{t('room_description_label')}</span>
                <textarea
                  placeholder={t('room_description_placeholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </label>

              <div className="room-form-grid room-form-grid-compact">
                <Input
                  label={t('room_floor_label')}
                  type="number"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
                <Input
                  label={t('room_capacity_label')}
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
                <Input
                  label={t('room_price_label')}
                  type="number"
                  min="0"
                  step="100"
                  value={form.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  required
                />
              </div>

              <div className={`room-price-note room-price-note-${priceMode}`}>
                <Wallet size={16} />
                <div>
                  <strong>{priceMode === 'inherited' ? t('room_inherited_price') : t('room_custom_price')}</strong>
                  {selectedCategory && (
                    <span>
                      {formatCurrency(selectedCategory.default_price, language)} - {getCategoryName(selectedCategory, language)}
                    </span>
                  )}
                </div>
                {selectedCategory && priceMode === 'custom' && (
                  <button type="button" onClick={applyCategoryPrice}>
                    {t('room_use_category_price')}
                  </button>
                )}
              </div>

              <label className="room-select-field">
                <span>{t('room_status_label')}</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {ROOM_STATUSES.map((status) => (
                    <option value={status} key={status}>
                      {getStatusLabel(status, language)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="room-modal-actions">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  {t('room_cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t('room_loading')
                    : editingRoom
                      ? t('room_save')
                      : t('room_create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="room-modal-backdrop" role="presentation">
          <div className="room-modal room-modal-small" role="dialog" aria-modal="true" aria-labelledby="room-delete-title">
            <div className="room-modal-header">
              <div>
                <span>{t('room_delete')}</span>
                <h2 id="room-delete-title">{t('room_delete_title')}</h2>
              </div>
              <button className="room-icon-btn" type="button" onClick={() => setDeleteTarget(null)} title={t('room_cancel')}>
                <X size={18} />
              </button>
            </div>

            <p className="room-delete-text">
              {t('room_delete_intro')} <strong>{deleteTarget.number}</strong>
            </p>
            <p className="room-delete-note">{t('room_delete_safety_note')}</p>

            <div className="room-modal-actions">
              <Button variant="secondary" type="button" onClick={() => setDeleteTarget(null)}>
                {t('room_cancel')}
              </Button>
              <Button variant="danger" type="button" disabled={deleting} onClick={confirmDelete}>
                <Trash2 size={16} />
                {deleting ? t('room_loading') : t('room_delete_confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
