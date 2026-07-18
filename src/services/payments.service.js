import { supabase } from '../lib/supabaseClient'

function toPaymentPayload(payment) {
  return {
    reservation_id: payment.reservation_id || null,
    amount: Number(payment.amount || 0),
    payment_date: payment.payment_date || null,
    payment_method: payment.payment_method?.trim() || null,
  }
}

export const paymentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, reservations(id, start_date, end_date, room_id, rooms(id, number), clients(id, name))')
      .order('payment_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(payment) {
    const payload = toPaymentPayload(payment)
    const { data, error } = await supabase.from('payments').insert(payload).select().single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const payload = toPaymentPayload(updates)
    const { data, error } = await supabase.from('payments').update(payload).eq('id', id).select().single()

    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('payments').delete().eq('id', id)

    if (error) throw error
  },
}
