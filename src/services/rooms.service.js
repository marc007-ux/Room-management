// src/services/rooms.service.js
import { supabase } from '../lib/supabaseClient'

export const TEST_ROOMS = [
  {
    number: 'A101',
    category: 'Furnished apartment',
    description: 'Spacious furnished apartment with living area and private bathroom.',
    floor: 1,
    capacity: 4,
    status: 'available',
  },
  {
    number: 'A102',
    category: 'Furnished apartment',
    description: 'Furnished apartment with balcony access and upgraded finish.',
    floor: 1,
    capacity: 3,
    status: 'reserved',
    priceOffset: 25000,
  },
  {
    number: 'B201',
    category: 'Unfurnished apartment',
    description: 'Large unfurnished apartment suitable for long-term rental.',
    floor: 2,
    capacity: 5,
    status: 'occupied',
  },
  {
    number: 'B202',
    category: 'Unfurnished apartment',
    description: 'Unfurnished apartment currently waiting for minor repairs.',
    floor: 2,
    capacity: 4,
    status: 'maintenance',
  },
  {
    number: 'S301',
    category: 'Furnished studio',
    description: 'Compact furnished studio with kitchenette.',
    floor: 3,
    capacity: 2,
    status: 'available',
  },
  {
    number: 'S302',
    category: 'Furnished studio',
    description: 'Premium furnished studio facing the main street.',
    floor: 3,
    capacity: 2,
    status: 'available',
    priceOffset: 15000,
  },
  {
    number: 'S401',
    category: 'Unfurnished studio',
    description: 'Quiet unfurnished studio for one or two occupants.',
    floor: 4,
    capacity: 2,
    status: 'occupied',
  },
  {
    number: 'S402',
    category: 'Unfurnished studio',
    description: 'Unfurnished studio temporarily out of service.',
    floor: 4,
    capacity: 1,
    status: 'out_of_service',
  },
  {
    number: 'C501',
    category: 'Room',
    description: 'Single non-furnished room with shared facilities.',
    floor: 5,
    capacity: 1,
    status: 'available',
  },
  {
    number: 'C502',
    category: 'Room',
    description: 'Single non-furnished room reserved for a new occupant.',
    floor: 5,
    capacity: 1,
    status: 'reserved',
  },
]

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toPrice(value) {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function toRoomPayload(room) {
  return {
    number: room.number.trim(),
    category_id: room.category_id || null,
    description: room.description?.trim() || null,
    floor: toNullableNumber(room.floor),
    capacity: toNullableNumber(room.capacity),
    price: toPrice(room.price),
    status: room.status || 'available',
  }
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function findCategory(categories, label, index) {
  const normalizedLabel = normalize(label)
  const category = categories.find(
    (item) => normalize(item.name_en) === normalizedLabel || normalize(item.name) === normalizedLabel,
  )

  return category || categories[index % categories.length] || null
}

export const roomsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, categories(id, name, name_en, default_price)')
      .order('number')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, categories(id, name, name_en, default_price)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getReservationCount(id) {
    const { count, error } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', id)

    if (error) throw error
    return count || 0
  },

  async create(room) {
    const payload = toRoomPayload(room)
    const { data, error } = await supabase
      .from('rooms')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const payload = toRoomPayload(updates)
    const { data, error } = await supabase
      .from('rooms')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const reservationCount = await this.getReservationCount(id)

    if (reservationCount > 0) {
      const error = new Error('ROOM_HAS_RESERVATIONS')
      error.code = 'ROOM_HAS_RESERVATIONS'
      error.reservationCount = reservationCount
      throw error
    }

    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) throw error
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async seedTestRooms(categories) {
    if (!categories.length) {
      const error = new Error('ROOMS_NEED_CATEGORIES')
      error.code = 'ROOMS_NEED_CATEGORIES'
      throw error
    }

    const { data: existingRooms, error: existingError } = await supabase
      .from('rooms')
      .select('number')

    if (existingError) throw existingError

    const existingNumbers = new Set((existingRooms || []).map((room) => normalize(room.number)))
    const missingRooms = TEST_ROOMS.filter((room) => !existingNumbers.has(normalize(room.number)))

    if (missingRooms.length === 0) return []

    const payload = missingRooms.map((room, index) => {
      const category = findCategory(categories, room.category, index)
      const categoryPrice = Number(category?.default_price || 0)

      return toRoomPayload({
        number: room.number,
        category_id: category?.id,
        description: room.description,
        floor: room.floor,
        capacity: room.capacity,
        price: categoryPrice + Number(room.priceOffset || 0),
        status: room.status,
      })
    })

    const { data, error } = await supabase
      .from('rooms')
      .insert(payload)
      .select()

    if (error) throw error
    return data || []
  },
}
