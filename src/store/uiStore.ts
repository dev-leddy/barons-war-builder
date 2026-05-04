import { create } from 'zustand'

type Panel = 'add_group' | 'save' | 'load' | 'share' | 'knight_commander' | 'dramatis_personae' | null

interface UIStore {
  activePanel: Panel
  editingGroupId: string | null
  selectedUnitTypeId: string | null
  isMobileNavOpen: boolean

  openPanel: (panel: Panel) => void
  closePanel: () => void
  startEditGroup: (groupId: string) => void
  stopEditGroup: () => void
  selectUnitType: (id: string | null) => void
  setMobileNavOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: null,
  editingGroupId: null,
  selectedUnitTypeId: null,
  isMobileNavOpen: false,

  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null, editingGroupId: null }),
  startEditGroup: (groupId) => set({ editingGroupId: groupId, activePanel: 'add_group' }),
  stopEditGroup: () => set({ editingGroupId: null, activePanel: null }),
  selectUnitType: (id) => set({ selectedUnitTypeId: id }),
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
}))
