import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useDueCount(deckId: string) {
  const { data, error, isLoading } = useSWR(`/api/decks/${deckId}/due`, fetcher, {
    refreshInterval: 60000,
  })
  return {
    dueCount: Array.isArray(data) ? data.length : 0,
    isLoading,
    error,
  }
}
