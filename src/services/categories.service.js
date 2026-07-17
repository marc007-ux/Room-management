import { supabase } from '../lib/supabaseClient'

export const DEFAULT_CATEGORIES = [
  {
    name: 'Appartement meublé',
    name_en: 'Furnished apartment',
    description: 'Appartement équipé avec meubles et commodités essentielles.',
    description_en: 'Apartment equipped with furniture and essential amenities.',
    default_price: 0,
  },
  {
    name: 'Appartement non meublé',
    name_en: 'Unfurnished apartment',
    description: 'Appartement loué sans mobilier.',
    description_en: 'Apartment rented without furniture.',
    default_price: 0,
  },
  {
    name: 'Studio meublé',
    name_en: 'Furnished studio',
    description: 'Studio équipé avec meubles et commodités essentielles.',
    description_en: 'Studio equipped with furniture and essential amenities.',
    default_price: 0,
  },
  {
    name: 'Studio non meublé',
    name_en: 'Unfurnished studio',
    description: 'Studio loué sans mobilier.',
    description_en: 'Studio rented without furniture.',
    default_price: 0,
  },
  {
    name: 'Chambre',
    name_en: 'Room',
    description: 'Chambre non meublée par défaut.',
    description_en: 'Unfurnished room by default.',
    default_price: 0,
  },
]

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function toPrice(value) {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function mapRoomCounts(rooms) {
  return rooms.reduce((counts, room) => {
    if (!room.category_id) return counts
    counts[room.category_id] = (counts[room.category_id] || 0) + 1
    return counts
  }, {})
}

function buildLocalizedPayload(input, language, existingCategory = null) {
  const name = input.name.trim()
  const description = input.description.trim()
  const payload = {
    default_price: toPrice(input.default_price),
  }

  if (language === 'fr') {
    payload.name = name
    payload.description = description
    payload.name_en = existingCategory?.name_en || name
    payload.description_en = existingCategory?.description_en || description
    return payload
  }

  payload.name_en = name
  payload.description_en = description
  payload.name = existingCategory?.name || name
  payload.description = existingCategory?.description || description
  return payload
}

export const categoriesService = {
  async getAll() {
    const [{ data: categories, error: categoriesError }, { data: rooms, error: roomsError }] =
      await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('rooms').select('category_id'),
      ])

    if (categoriesError) throw categoriesError
    if (roomsError) throw roomsError

    const roomCounts = mapRoomCounts(rooms || [])

    return (categories || []).map((category) => ({
      ...category,
      room_count: roomCounts[category.id] || 0,
    }))
  },

  async getRoomCount(id) {
    const { count, error } = await supabase
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (error) throw error
    return count || 0
  },

  async create(input, language) {
    const payload = buildLocalizedPayload(input, language)
    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, input, language, existingCategory) {
    const payload = buildLocalizedPayload(input, language, existingCategory)
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async remove(id) {
    const roomCount = await this.getRoomCount(id)

    if (roomCount > 0) {
      const error = new Error('CATEGORY_HAS_ROOMS')
      error.code = 'CATEGORY_HAS_ROOMS'
      error.roomCount = roomCount
      throw error
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },

  async seedDefaults() {
    const { data: existingCategories, error: existingError } = await supabase
      .from('categories')
      .select('name, name_en')

    if (existingError) throw existingError

    const existingNames = new Set()
    ;(existingCategories || []).forEach((category) => {
      existingNames.add(normalize(category.name))
      existingNames.add(normalize(category.name_en))
    })

    const missingCategories = DEFAULT_CATEGORIES.filter(
      (category) =>
        !existingNames.has(normalize(category.name)) &&
        !existingNames.has(normalize(category.name_en)),
    )

    if (missingCategories.length === 0) return []

    const { data, error } = await supabase
      .from('categories')
      .insert(missingCategories)
      .select()

    if (error) throw error
    return data || []
  },
}
