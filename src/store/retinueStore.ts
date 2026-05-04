import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Retinue, Group, Commander, ValidationError, Experience } from '@/src/types'
import type { FactionId } from '@/src/data/factions'
import { unitTypeById } from '@/src/data/unitTypes'
import { defaultEquipment } from '@/src/logic/equipment'
import { validateRetinue } from '@/src/logic/validation'
import { computeRetinueCost } from '@/src/logic/costs'

const DEFAULT_RETINUE: Retinue = {
  id: uuid(),
  name: 'New Retinue',
  faction: 'feudal_european',
  pointsLimit: 500,
  retinueLeaderGroupId: null,
  groups: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

interface RetinueStore {
  retinue: Retinue
  validationErrors: ValidationError[]
  isDirty: boolean
  totalCost: number

  // Retinue-level actions
  setRetinueName: (name: string) => void
  setFaction: (faction: FactionId) => void
  setPointsLimit: (limit: number) => void
  setRetinueLeader: (groupId: string) => void
  loadRetinue: (retinue: Retinue) => void
  resetRetinue: () => void

  // Group actions
  addGroup: (group: Group) => void
  updateGroup: (id: string, patch: Partial<Group>) => void
  removeGroup: (id: string) => void
  duplicateGroup: (id: string) => void
  linkGroups: (commanderGroupId: string, warriorGroupId: string) => void
  unlinkGroup: (warriorGroupId: string) => void
  autoLinkGroup: (commanderGroupId: string, unitTypeId: string) => void

  // Commander actions
  setCommander: (groupId: string, commander: Commander) => void

  // Serialisation
  exportJSON: () => string
  importJSON: (json: string) => boolean
}

function revalidate(retinue: Retinue) {
  return {
    validationErrors: validateRetinue(retinue),
    totalCost: computeRetinueCost(retinue),
    isDirty: true,
    retinue: { ...retinue, updatedAt: new Date().toISOString() },
  }
}

export const useRetinueStore = create<RetinueStore>((set, get) => ({
  retinue: DEFAULT_RETINUE,
  validationErrors: [],
  isDirty: false,
  totalCost: 0,

  setRetinueName: (name) =>
    set(({ retinue }) => revalidate({ ...retinue, name })),

  setFaction: (faction) =>
    set(({ retinue }) => revalidate({ ...retinue, faction, groups: [], retinueLeaderGroupId: null })),

  setPointsLimit: (limit) =>
    set(({ retinue }) => revalidate({ ...retinue, pointsLimit: limit })),

  setRetinueLeader: (groupId) =>
    set(({ retinue }) => {
      const groups = retinue.groups.map(g => ({
        ...g,
        commander: g.commander
          ? { ...g.commander, isRetinueLeader: g.id === groupId }
          : null,
      }))
      return revalidate({ ...retinue, groups, retinueLeaderGroupId: groupId })
    }),

  loadRetinue: (retinue) => {
    // Migrate saves that predate commanderGroupId
    const migrated: Retinue = {
      ...retinue,
      groups: retinue.groups.map(g => ({
        ...g,
        commanderGroupId: (g as any).commanderGroupId ?? null,
      })),
    }
    set({
      retinue: migrated,
      validationErrors: validateRetinue(migrated),
      totalCost: computeRetinueCost(migrated),
      isDirty: false,
    })
  },

  resetRetinue: () => {
    const fresh = { ...DEFAULT_RETINUE, id: uuid(), createdAt: new Date().toISOString() }
    set({ retinue: fresh, validationErrors: [], totalCost: 0, isDirty: false })
  },

  addGroup: (group) =>
    set(({ retinue }) => {
      const groups = [...retinue.groups, group]
      // Auto-assign retinue leader if this is the first commander
      let retinueLeaderGroupId = retinue.retinueLeaderGroupId
      if (!retinueLeaderGroupId && group.isCommandGroup && group.commander) {
        retinueLeaderGroupId = group.id
        group = { ...group, commander: { ...group.commander, isRetinueLeader: true } }
      }
      return revalidate({ ...retinue, groups, retinueLeaderGroupId })
    }),

  updateGroup: (id, patch) =>
    set(({ retinue }) => {
      const groups = retinue.groups.map(g => g.id === id ? { ...g, ...patch } : g)
      return revalidate({ ...retinue, groups })
    }),

  removeGroup: (id) =>
    set(({ retinue }) => {
      const isCommander = unitTypeById[retinue.groups.find(g => g.id === id)?.unitTypeId ?? '']?.isCommander ?? false
      let groups = retinue.groups.filter(g => g.id !== id)
      if (isCommander) {
        // Clear the link on any warrior groups that were serving this commander
        groups = groups.map(g =>
          g.commanderGroupId === id ? { ...g, commanderGroupId: null } : g
        )
      }
      const retinueLeaderGroupId =
        retinue.retinueLeaderGroupId === id ? null : retinue.retinueLeaderGroupId
      return revalidate({ ...retinue, groups, retinueLeaderGroupId })
    }),

  duplicateGroup: (id) =>
    set(({ retinue }) => {
      const source = retinue.groups.find(g => g.id === id)
      if (!source) return {}
      const copy: Group = {
        ...source,
        id: uuid(),
        commanderGroupId: null,  // duplicates always start unlinked
        commander: source.commander
          ? { ...source.commander, id: uuid(), isRetinueLeader: false }
          : null,
      }
      const groups = [...retinue.groups, copy]
      return revalidate({ ...retinue, groups })
    }),

  linkGroups: (commanderGroupId, warriorGroupId) =>
    set(({ retinue }) => {
      const groups = retinue.groups.map(g => {
        if (g.id === warriorGroupId) return { ...g, commanderGroupId }
        // Clear any other warrior that was already linked to this commander
        if (g.commanderGroupId === commanderGroupId && g.id !== warriorGroupId)
          return { ...g, commanderGroupId: null }
        return g
      })
      return revalidate({ ...retinue, groups })
    }),

  unlinkGroup: (warriorGroupId) =>
    set(({ retinue }) => {
      const groups = retinue.groups.map(g =>
        g.id === warriorGroupId ? { ...g, commanderGroupId: null } : g
      )
      return revalidate({ ...retinue, groups })
    }),

  autoLinkGroup: (commanderGroupId, warriorUnitTypeId) =>
    set(({ retinue }) => {
      const ut = unitTypeById[warriorUnitTypeId]
      if (!ut) return {}
      const experience: Experience = ut.experienceOptions.includes('regular')
        ? 'regular'
        : ut.experienceOptions[0]
      const minSize = ut.minGroupSize ?? (ut.isMounted ? 2 : 4)
      const newGroup: Group = {
        id: uuid(),
        unitTypeId: warriorUnitTypeId,
        experience,
        count: minSize,
        isCommandGroup: false,
        commandGroupUpgrade: { banner: false, pennant: false, musician: false, priest: false },
        equipment: defaultEquipment(ut, experience),
        purchasedAbilities: [],
        commander: null,
        commanderGroupId,
      }
      // Clear any existing link to this commander
      const groups = retinue.groups.map(g =>
        g.commanderGroupId === commanderGroupId ? { ...g, commanderGroupId: null } : g
      )
      return revalidate({ ...retinue, groups: [...groups, newGroup] })
    }),

  setCommander: (groupId, commander) =>
    set(({ retinue }) => {
      const groups = retinue.groups.map(g =>
        g.id === groupId ? { ...g, commander } : g
      )
      return revalidate({ ...retinue, groups })
    }),

  exportJSON: () => JSON.stringify(get().retinue, null, 2),

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Retinue
      if (!parsed.id || !Array.isArray(parsed.groups)) return false
      get().loadRetinue(parsed)  // loadRetinue handles migration
      return true
    } catch {
      return false
    }
  },
}))
