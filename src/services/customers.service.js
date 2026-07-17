import { supabase } from '../lib/supabaseClient'

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function toCustomerPayload(customer) {
  return {
    name: customer.name?.trim() || '',
    phone: customer.phone?.trim() || null,
    email: customer.email?.trim() || null,
    identification: customer.identification?.trim() || null,
    address: customer.address?.trim() || null,
  }
}

export const customersService = {
  async getAll() {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  async create(customer) {
    const payload = toCustomerPayload(customer)
    const { data, error } = await supabase.from('clients').insert(payload).select().single()

    if (error) throw error
    return data
  },

  async update(id, updates) {
    const payload = toCustomerPayload(updates)
    const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single()

    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) throw error
  },

  async seedTestCustomers() {
    const { data: existingCustomers, error: existingError } = await supabase.from('clients').select('email')

    if (existingError) throw existingError

    const existingEmails = new Set((existingCustomers || []).map((customer) => normalize(customer.email)))
    const seedCustomers = [
      {
        name: 'Amara Diop',
        phone: '+221 77 111 2233',
        email: 'amara.diop@example.com',
        identification: 'ID-1001',
        address: 'Route de Ouakam, Dakar',
      },
      {
        name: 'Moussa Fall',
        phone: '+221 78 222 3344',
        email: 'moussa.fall@example.com',
        identification: 'ID-1002',
        address: 'Liberté 6, Dakar',
      },
      {
        name: 'Awa Ndiaye',
        phone: '+221 76 333 4455',
        email: 'awa.ndiaye@example.com',
        identification: 'ID-1003',
        address: 'Mermoz, Dakar',
      },
    ]

    const missingCustomers = seedCustomers.filter((customer) => !existingEmails.has(normalize(customer.email)))

    if (missingCustomers.length === 0) return []

    const { data, error } = await supabase.from('clients').insert(missingCustomers).select()

    if (error) throw error
    return data || []
  },
}
