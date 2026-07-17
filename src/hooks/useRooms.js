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
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    roomsService
      .getAll()
      .then((data) => {
        if (!active) return
        setRooms(data)
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const createRoom = useCallback(
    async (input) => {
      await roomsService.create(input)
      return fetchRooms()
    },
    [fetchRooms],
  )

  const updateRoom = useCallback(
    async (id, input) => {
      await roomsService.update(id, input)
      return fetchRooms()
    },
    [fetchRooms],
  )

  const deleteRoom = useCallback(
    async (id) => {
      await roomsService.remove(id)
      return fetchRooms()
    },
    [fetchRooms],
  )

  const updateRoomStatus = useCallback(
    async (id, status) => {
      await roomsService.updateStatus(id, status)
      return fetchRooms()
    },
    [fetchRooms],
  )

  const seedTestRooms = useCallback(
    async (categories) => {
      const inserted = await roomsService.seedTestRooms(categories)
      await fetchRooms()
      return inserted
    },
    [fetchRooms],
  )

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    seedTestRooms,
  }
}
