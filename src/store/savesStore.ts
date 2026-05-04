import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Retinue, SaveSlot, SaveCategory } from '@/src/types'

const MAX_SAVES = 10
const STORAGE_KEY = 'bw_saves'

interface SavesStore {
  saves: SaveSlot[]
  draft: Retinue | null

  // Draft (auto-save on every change)
  saveDraft: (retinue: Retinue) => void
  loadDraft: () => Retinue | null
  clearDraft: () => void

  // Explicit save slots
  save: (retinue: Retinue, name: string, category: SaveCategory, slotId?: string) => boolean
  deleteSave: (id: string) => void
  renameSave: (id: string, name: string) => void
}

export const useSavesStore = create<SavesStore>()(
  persist(
    (set, get) => ({
      saves: [],
      draft: null,

      saveDraft: (retinue) => set({ draft: retinue }),
      loadDraft: () => get().draft,
      clearDraft: () => set({ draft: null }),

      save: (retinue, name, category, slotId) => {
        const saves = get().saves
        const existingIdx = slotId ? saves.findIndex(s => s.id === slotId) : -1

        if (existingIdx >= 0) {
          // Overwrite existing slot
          const updated = [...saves]
          updated[existingIdx] = {
            ...updated[existingIdx],
            name,
            category,
            data: retinue,
            updatedAt: new Date().toISOString(),
          }
          set({ saves: updated })
          return true
        }

        // New save slot
        if (saves.length >= MAX_SAVES) return false

        const slot: SaveSlot = {
          id: uuid(),
          name,
          category,
          data: retinue,
          updatedAt: new Date().toISOString(),
        }
        set({ saves: [slot, ...saves] })
        return true
      },

      deleteSave: (id) =>
        set(({ saves }) => ({ saves: saves.filter(s => s.id !== id) })),

      renameSave: (id, name) =>
        set(({ saves }) => ({
          saves: saves.map(s => s.id === id ? { ...s, name } : s),
        })),
    }),
    {
      name: STORAGE_KEY,
      // Only persist saves and draft
      partialize: (state) => ({ saves: state.saves, draft: state.draft }),
    }
  )
)
