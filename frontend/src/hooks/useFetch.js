/**
 * useFetch.js - Custom hook for data fetching with loading/error state
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/**
 * useFetch - fetches data from the given URL on mount (and on refetch())
 * @param {string} url - API endpoint (relative to /api)
 * @param {Object} [options] - Axios request config
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(url, options = {}) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url, options)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
