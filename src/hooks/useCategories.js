import { useCallback, useEffect, useState } from 'react'
import { categoriesService } from '../services/categories.service'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyCategories = useCallback(async () => {
    const data = await categoriesService.getAll()
    setCategories(data)
    setError(null)
    return data
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      return await applyCategories()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [applyCategories])

  useEffect(() => {
    let active = true

    categoriesService
      .getAll()
      .then((data) => {
        if (!active) return
        setCategories(data)
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

  const createCategory = useCallback(
    async (input, language) => {
      await categoriesService.create(input, language)
      return refetch()
    },
    [refetch],
  )

  const updateCategory = useCallback(
    async (category, input, language) => {
      await categoriesService.update(category.id, input, language, category)
      return refetch()
    },
    [refetch],
  )

  const deleteCategory = useCallback(
    async (id) => {
      await categoriesService.remove(id)
      return refetch()
    },
    [refetch],
  )

  const seedDefaultCategories = useCallback(async () => {
    const inserted = await categoriesService.seedDefaults()
    await refetch()
    return inserted
  }, [refetch])

  return {
    categories,
    loading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    seedDefaultCategories,
  }
}
