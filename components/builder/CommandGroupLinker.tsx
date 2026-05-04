'use client'

import { Link2, Link2Off, Plus } from 'lucide-react'
import { unitTypeById } from '@/src/data/unitTypes'
import { useRetinueStore } from '@/src/store/retinueStore'
import { cn } from '@/lib/utils'
import type { Group } from '@/src/types'

interface Props {
  commanderGroup: Group
  /** Render as a centred panel (for the empty right half of a side-by-side cluster) */
  panelMode?: boolean
}

export function CommandGroupLinker({ commanderGroup, panelMode = false }: Props) {
  const allGroups = useRetinueStore(s => s.retinue.groups)
  const linkGroups = useRetinueStore(s => s.linkGroups)
  const unlinkGroup = useRetinueStore(s => s.unlinkGroup)
  const autoLinkGroup = useRetinueStore(s => s.autoLinkGroup)

  const cmdUnitType = unitTypeById[commanderGroup.unitTypeId]
  if (!cmdUnitType || cmdUnitType.commandGroupFrom.length === 0) return null

  const compatibleTypeIds = cmdUnitType.commandGroupFrom

  // The warrior group currently linked to this commander
  const linkedGroup = allGroups.find(g => g.commanderGroupId === commanderGroup.id) ?? null

  // Unlinked warrior groups that are a compatible type
  const availableCandidates = allGroups.filter(g => {
    if (unitTypeById[g.unitTypeId]?.isCommander) return false
    if (g.commanderGroupId !== null) return false
    return compatibleTypeIds.includes(g.unitTypeId)
  })

  // ── Panel mode: unlinked state rendered as a centred call-to-action panel ───
  if (panelMode && !linkedGroup) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full p-5 text-center bg-yellow-500/3">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-yellow-500/40 flex items-center justify-center">
          <Link2 className="h-4 w-4 text-yellow-500/50" />
        </div>
        <p className="text-xs font-medium text-yellow-600/80 dark:text-yellow-400/80">
          No Command Group attached
        </p>

        {availableCandidates.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Attach existing</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {availableCandidates.map(g => {
                const wt = unitTypeById[g.unitTypeId]
                return (
                  <button
                    key={g.id}
                    onClick={() => linkGroups(commanderGroup.id, g.id)}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-secondary hover:bg-accent border border-border/60 transition-colors"
                  >
                    {g.count}× {wt?.name ?? g.unitTypeId}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 w-full">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {availableCandidates.length > 0 ? 'Or add new' : 'Add group'}
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {compatibleTypeIds.map(typeId => {
              const wt = unitTypeById[typeId]
              return (
                <button
                  key={typeId}
                  onClick={() => autoLinkGroup(commanderGroup.id, typeId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {wt?.name ?? typeId}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── State A: linked ──────────────────────────────────────────────────────────
  if (linkedGroup) {
    const warriorType = unitTypeById[linkedGroup.unitTypeId]
    const label = `${linkedGroup.count}× ${warriorType?.name ?? linkedGroup.unitTypeId}`
    return (
      <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-md bg-primary/8 border border-primary/20 text-sm">
        <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 font-medium text-foreground/80">
          Commands: <span className="text-primary">{label}</span>
        </span>
        {availableCandidates.length > 0 && (
          <select
            onChange={e => { if (e.target.value) linkGroups(commanderGroup.id, e.target.value) }}
            value=""
            className="text-xs text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground focus:outline-none"
          >
            <option value="" disabled>Change</option>
            {availableCandidates.map(g => (
              <option key={g.id} value={g.id}>
                {unitTypeById[g.unitTypeId]?.name} ({g.count}×)
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => unlinkGroup(linkedGroup.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          title="Unlink warrior group"
        >
          <Link2Off className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // ── State B/C: unlinked ──────────────────────────────────────────────────────
  return (
    <div className="mx-4 mb-3 rounded-md border border-dashed border-yellow-500/40 bg-yellow-500/5 px-3 py-2.5 space-y-2">
      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
        No Command Group attached
      </p>

      {/* Attach an existing compatible group */}
      {availableCandidates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Attach:</span>
          {availableCandidates.map(g => {
            const wt = unitTypeById[g.unitTypeId]
            return (
              <button
                key={g.id}
                onClick={() => linkGroups(commanderGroup.id, g.id)}
                className="px-2 py-0.5 rounded text-xs font-medium bg-secondary hover:bg-accent border border-border/60 transition-colors"
              >
                {g.count}× {wt?.name ?? g.unitTypeId}
              </button>
            )
          })}
        </div>
      )}

      {/* Add a new compatible warrior group and auto-link */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground self-center">
          {availableCandidates.length > 0 ? 'Or add new:' : 'Add:'}
        </span>
        {compatibleTypeIds.map(typeId => {
          const wt = unitTypeById[typeId]
          return (
            <button
              key={typeId}
              onClick={() => autoLinkGroup(commanderGroup.id, typeId)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors',
                'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              )}
            >
              <Plus className="h-3 w-3" />
              {wt?.name ?? typeId}
            </button>
          )
        })}
      </div>
    </div>
  )
}
