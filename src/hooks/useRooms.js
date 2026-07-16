// src/hooks/useRooms.js
import { useState, useEffect, useCallback } from 'react'
import { roomsService } from '../services/rooms.service'

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await roomsService.getAll()
      setRooms(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  return { rooms, loading, error, refetch: fetchRooms }
}