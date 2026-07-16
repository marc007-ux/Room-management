// src/pages/RoomsPage.jsx
import { useState } from 'react'
import { useRooms } from '../hooks/useRooms'
import { roomsService } from '../services/rooms.service'

export default function RoomsPage() {
  const { rooms, loading, error, refetch } = useRooms()
  const [form, setForm] = useState({ number: '', floor: '', capacity: '', price: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await roomsService.create({
        number: form.number,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        price: Number(form.price),
      })
      setForm({ number: '', floor: '', capacity: '', price: '' })
      refetch()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this room?')) return
    await roomsService.remove(id)
    refetch()
  }

  if (loading) return <div>Loading rooms...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Rooms</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Room number"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          required
        />
        <input
          placeholder="Floor"
          type="number"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
        />
        <input
          placeholder="Capacity"
          type="number"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Room'}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Number</th><th>Floor</th><th>Capacity</th><th>Price</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.number}</td>
              <td>{room.floor}</td>
              <td>{room.capacity}</td>
              <td>{room.price}</td>
              <td>{room.status}</td>
              <td><button onClick={() => handleDelete(room.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}