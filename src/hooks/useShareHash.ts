import { useEffect } from 'react'
import { useRetinueStore } from '@/src/store/retinueStore'
import { consumeHashRetinue } from '@/src/logic/share'

/** On mount: reads retinue from URL hash if present, loads it, then cleans the URL. */
export function useShareHash() {
  const loadRetinue = useRetinueStore(s => s.loadRetinue)

  useEffect(() => {
    const retinue = consumeHashRetinue()
    if (retinue) {
      loadRetinue(retinue)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
