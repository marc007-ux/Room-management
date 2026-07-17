import { useMemo, useState } from 'react'
import { DoorOpen, Layers, Pencil, Plus, Sparkles, Tag, Trash2, Wallet, X } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useLanguage } from '../hooks/useLanguage'
import { DEFAULT_CATEGORIES } from '../services/categories.service'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import './CategoriesPage.css'

const EMPTY_FORM = { name: '', description: '', default_price: '' }

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function getCategoryName(category, language) {
  if (language === 'fr') return category.name || category.name_en || ''
  return category.name_en || category.name || ''
}

function getCategoryDescription(category, language) {
  if (language === 'fr') return category.description || category.description_en || ''
  return category.description_en || category.description || ''
}

function formatCurrency(value, language) {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const amount = Number(value || 0)

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)} FCFA`
}

function getRoomCountLabel(count, t) {
  const key = count === 1 ? 'categories_room' : 'categories_rooms'
  return `${count} ${t(key)}`
}

function getMissingDefaultCount(categories) {
  const existingNames = new Set()

  categories.forEach((category) => {
    existingNames.add(normalize(category.name))
    existingNames.add(normalize(category.name_en))
  })

  return DEFAULT_CATEGORIES.filter(
    (category) =>
      !existingNames.has(normalize(category.name)) &&
      !existingNames.has(normalize(category.name_en)),
  ).length
}

function getCategoryErrorMessage(err, t) {
  if (err?.message?.toLocaleLowerCase().includes('row-level security')) {
    return t('category_auth_required')
  }

  return err?.message || t('category_error_title')
}

export default function CategoriesPage() {
  const { language, t } = useLanguage()
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    seedDefaultCategories,
  } = useCategories()

  const [feedback, setFeedback] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const stats = useMemo(() => {
    const assignedRooms = categories.reduce((total, category) => total + (category.room_count || 0), 0)

    return {
      totalCategories: categories.length,
      assignedRooms,
      missingDefaultCount: getMissingDefaultCount(categories),
    }
  }, [categories])

  function openCreateForm() {
    setEditingCategory(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setForm({
      name: getCategoryName(category, language),
      description: getCategoryDescription(category, language),
      default_price: String(category.default_price ?? 0),
    })
    setFormError(null)
    setFeedback(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCategory(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.name.trim()) {
      setFormError(t('category_name_required'))
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingCategory) {
        await updateCategory(editingCategory, form, language)
        setFeedback({ type: 'success', text: t('category_update_success') })
      } else {
        await createCategory(form, language)
        setFeedback({ type: 'success', text: t('category_create_success') })
      }

      closeForm()
    } catch (err) {
      setFormError(getCategoryErrorMessage(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSeedDefaults() {
    setSeeding(true)
    setFeedback(null)

    try {
      const inserted = await seedDefaultCategories()
      setFeedback({
        type: 'success',
        text: inserted.length > 0 ? t('category_seed_success') : t('category_seed_none'),
      })
    } catch (err) {
      setFeedback({ type: 'error', text: getCategoryErrorMessage(err, t) })
    } finally {
      setSeeding(false)
    }
  }

  function requestDelete(category) {
    if (category.room_count > 0) {
      setFeedback({
        type: 'error',
        text: `${t('category_delete_blocked')} ${getRoomCountLabel(category.room_count, t)}.`,
      })
      return
    }

    setFeedback(null)
    setDeleteTarget(category)
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)

    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({ type: 'success', text: t('category_delete_success') })
    } catch (err) {
      const text =
        err.code === 'CATEGORY_HAS_ROOMS'
          ? `${t('category_delete_blocked')} ${getRoomCountLabel(err.roomCount || 0, t)}.`
          : getCategoryErrorMessage(err, t)

      setFeedback({ type: 'error', text })
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <div>
          <div className="categories-kicker">
            <Layers size={15} />
            <span>{t('categories_title')}</span>
          </div>
          <h1>{t('categories_title')}</h1>
          <p>{t('categories_subtitle')}</p>
        </div>

        <div className="categories-header-actions">
          {stats.missingDefaultCount > 0 && (
            <Button variant="secondary" onClick={handleSeedDefaults} disabled={seeding || loading}>
              <Sparkles size={16} />
              {seeding ? t('category_loading') : t('categories_add_defaults')}
            </Button>
          )}
          <Button onClick={openCreateForm}>
            <Plus size={16} />
            {t('categories_add')}
          </Button>
        </div>
      </div>

      <div className="categories-stats">
        <div className="category-stat">
          <span>{t('categories_total')}</span>
          <strong>{stats.totalCategories}</strong>
        </div>
        <div className="category-stat">
          <span>{t('categories_assigned_rooms')}</span>
          <strong>{stats.assignedRooms}</strong>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {error && (
        <Alert type="error">
          <strong>{t('category_error_title')}:</strong> {error}
        </Alert>
      )}

      {loading ? (
        <Card className="categories-loading">{t('category_loading')}</Card>
      ) : categories.length === 0 ? (
        <div className="categories-empty">
          <div className="categories-empty-icon">
            <Tag size={24} />
          </div>
          <h2>{t('categories_empty_title')}</h2>
          <p>{t('categories_empty_text')}</p>
          <div className="categories-empty-actions">
            <Button onClick={handleSeedDefaults} disabled={seeding}>
              <Sparkles size={16} />
              {t('categories_add_defaults')}
            </Button>
            <Button variant="secondary" onClick={openCreateForm}>
              <Plus size={16} />
              {t('categories_add')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="categories-list">
          {categories.map((category) => {
            const name = getCategoryName(category, language)
            const description = getCategoryDescription(category, language)

            return (
              <Card className="category-item" key={category.id}>
                <div className="category-icon">
                  <Tag size={20} />
                </div>

                <div className="category-main">
                  <div className="category-title-row">
                    <h2>{name}</h2>
                    <Badge status="category">{getRoomCountLabel(category.room_count || 0, t)}</Badge>
                  </div>
                  <p>{description || t('categories_no_description')}</p>

                  <div className="category-meta">
                    <span>
                      <Wallet size={15} />
                      {t('categories_default_price')}
                      <strong>{formatCurrency(category.default_price, language)}</strong>
                    </span>
                    <span>
                      <DoorOpen size={15} />
                      {t('categories_assigned_rooms')}
                      <strong>{category.room_count || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="category-actions">
                  <button className="category-icon-btn" type="button" onClick={() => openEditForm(category)} title={t('category_edit')}>
                    <Pencil size={16} />
                  </button>
                  <button className="category-icon-btn category-icon-btn-danger" type="button" onClick={() => requestDelete(category)} title={t('category_delete')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {formOpen && (
        <div className="category-modal-backdrop" role="presentation">
          <div className="category-modal" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
            <div className="category-modal-header">
              <div>
                <span>{t('categories_title')}</span>
                <h2 id="category-form-title">
                  {editingCategory ? t('category_form_edit_title') : t('category_form_create_title')}
                </h2>
              </div>
              <button className="category-icon-btn" type="button" onClick={closeForm} title={t('category_cancel')}>
                <X size={18} />
              </button>
            </div>

            {formError && <Alert type="error">{formError}</Alert>}

            <form onSubmit={handleSubmit}>
              <Input
                label={t('category_name_label')}
                placeholder={t('category_name_placeholder')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <label className="category-textarea-field">
                <span>{t('category_description_label')}</span>
                <textarea
                  placeholder={t('category_description_placeholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </label>

              <Input
                label={t('category_price_label')}
                type="number"
                min="0"
                step="100"
                value={form.default_price}
                onChange={(e) => setForm({ ...form, default_price: e.target.value })}
              />
              <p className="category-form-hint">{t('category_price_hint')}</p>

              <div className="category-modal-actions">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  {t('category_cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t('category_loading')
                    : editingCategory
                      ? t('category_save')
                      : t('category_create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="category-modal-backdrop" role="presentation">
          <div className="category-modal category-modal-small" role="dialog" aria-modal="true" aria-labelledby="category-delete-title">
            <div className="category-modal-header">
              <div>
                <span>{t('category_delete')}</span>
                <h2 id="category-delete-title">{t('category_delete_title')}</h2>
              </div>
              <button className="category-icon-btn" type="button" onClick={() => setDeleteTarget(null)} title={t('category_cancel')}>
                <X size={18} />
              </button>
            </div>

            <p className="category-delete-text">
              {t('category_delete_intro')} <strong>{getCategoryName(deleteTarget, language)}</strong>
            </p>

            <div className="category-modal-actions">
              <Button variant="secondary" type="button" onClick={() => setDeleteTarget(null)}>
                {t('category_cancel')}
              </Button>
              <Button variant="danger" type="button" disabled={deleting} onClick={confirmDelete}>
                <Trash2 size={16} />
                {deleting ? t('category_loading') : t('category_delete_confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
