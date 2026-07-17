import { supabase } from '../lib/supabaseClient'
import { roomsService } from './rooms.service'

function toReservationPayload(reservation) {
  return {
    client_id: reservation.client_id || null,
    room_id: reservation.room_id || null,
    start_date: reservation.start_date || null,
    end_date: reservation.end_date || null,
    amount: Number(reservation.amount || 0),
  }
}

function getDerivedStatus(reservation) {
  if (!reservation) return 'active'
  if (reservation.status === 'cancelled') return 'cancelled'

  const today = new Date().toISOString().slice(0, 10)
  const endDate = normalizeDate(reservation.end_date)
  const startDate = normalizeDate(reservation.start_date)

  if (today < startDate) return 'active'
  if (today > endDate) return 'completed'
  return 'active'
}

function normalizeDate(date) {
  if (!date) return null
  return new Date(date).toISOString().slice(0, 10)
}

async function ensureAvailability(roomId, startDate, endDate, ignoreReservationId = null) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id, room_id, start_date, end_date, status')
    .eq('room_id', roomId)
    .neq('status', 'cancelled')

  if (error) throw error

  const currentStart = normalizeDate(startDate)
  const currentEnd = normalizeDate(endDate)

  const overlaps = (data || []).some((reservation) => {
    if (reservation.id === ignoreReservationId) return false
    if (reservation.status === 'cancelled') return false

    const existingStart = normalizeDate(reservation.start_date)
    const existingEnd = normalizeDate(reservation.end_date)

    return (
      existingStart &&
      existingEnd &&
      currentStart &&
      currentEnd &&
      currentStart < existingEnd &&
      currentEnd > existingStart
    )
  })

  if (overlaps) {
    const availabilityError = new Error('RESERVATION_OVERLAP')
    availabilityError.code = 'RESERVATION_OVERLAP'
    throw availabilityError
  }
}

async function syncRoomStatus(roomId, reservation) {
  const today = new Date().toISOString().slice(0, 10)
  const derivedStatus = getDerivedStatus(reservation)
  let nextStatus = 'available'

  if (derivedStatus === 'cancelled') {
    nextStatus = 'available'
  } else if (derivedStatus === 'active') {
    if (reservation.start_date <= today) {
      nextStatus = 'occupied'
    } else {
      nextStatus = 'reserved'
    }
  } else if (derivedStatus === 'completed') {
    nextStatus = 'maintenance'
  }

  await roomsService.updateStatus(roomId, nextStatus)
}

export const reservationsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, clients(id, name, phone), rooms(id, number, status)')
      .order('start_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getHistory(clientId, roomId) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, rooms(id, number)')
      .eq('client_id', clientId)
      .eq('room_id', roomId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(reservation) {
    const room = await roomsService.getById(reservation.room_id)
    const payload = toReservationPayload(reservation)
    const days = Math.max(1, Math.ceil((new Date(payload.end_date) - new Date(payload.start_date)) / (1000 * 60 * 60 * 24)))
    payload.amount = Number(room?.price || 0) * days
    await ensureAvailability(payload.room_id, payload.start_date, payload.end_date)
    const { data, error } = await supabase.from('reservations').insert(payload).select().single()

    if (error) throw error
    await syncRoomStatus(payload.room_id, data)
    return data
  },

  async update(id, updates) {
    const current = await this.getById(id)
    const room = await roomsService.getById(updates.room_id || current.room_id)
    const payload = toReservationPayload({ ...current, ...updates })
    const days = Math.max(1, Math.ceil((new Date(payload.end_date) - new Date(payload.start_date)) / (1000 * 60 * 60 * 24)))
    payload.amount = Number(room?.price || 0) * days
    await ensureAvailability(payload.room_id, payload.start_date, payload.end_date, id)
    const { data, error } = await supabase.from('reservations').update(payload).eq('id', id).select().single()

    if (error) throw error
    await syncRoomStatus(payload.room_id, data)
    return data
  },

  async getById(id) {
    const { data, error } = await supabase.from('reservations').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  async checkIn(id) {
    const reservation = await this.getById(id)
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await syncRoomStatus(reservation.room_id, data)
    return data
  },

  async checkOut(id) {
    const reservation = await this.getById(id)
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await syncRoomStatus(reservation.room_id, data)
    return data
  },

  async cancel(id) {
    const reservation = await this.getById(id)
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await syncRoomStatus(reservation.room_id, data)
    return data
  },

  async extend(id, endDate) {
    const reservation = await this.getById(id)
    const payload = { end_date: normalizeDate(endDate) }
    await ensureAvailability(reservation.room_id, reservation.start_date, payload.end_date, id)
    const { data, error } = await supabase.from('reservations').update(payload).eq('id', id).select().single()

    if (error) throw error
    await syncRoomStatus(reservation.room_id, data)
    return data
  },
}

