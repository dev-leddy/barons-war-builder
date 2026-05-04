import { useEffect, useRef } from 'react'
import { useRetinueStore } from '@/src/store/retinueStore'
import { useSavesStore } from '@/src/store/savesStore'

const DEBOUNCE_MS = 500

/** Automatically saves the retinue to draft storage 500ms after any change. */
export function useAutoDraft() {
  const retinue = useRetinueStore(s => s.retinue)
  const isDirty = useRetinueStore(s => s.isDirty)
  const saveDraft = useSavesStore(s => s.saveDraft)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveDraft(retinue)
    }, DEBOUNCE_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [retinue, isDirty, saveDraft])
}
