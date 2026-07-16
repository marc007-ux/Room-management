// src/services/rooms.service.js
import { supabase } from '../lib/supabaseClient'

export const roomsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, categories(name)')
      .order('number')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, categories(name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(room) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(room)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) throw error
  },

  async updateStatus(id, status) {
    return this.update(id, { status })
  },
}