'use client'

import { useRetinue } from '@/src/hooks/useRetinue'
import { useUIStore } from '@/src/store/uiStore'
import { unitTypeById } from '@/src/data/unitTypes'
import { computeGroupCost } from '@/src/logic/costs'
import type { Group } from '@/src/types'
import type { ValidationError } from '@/src/types'
import { GroupCard } from './GroupCard'
import { CommandGroupLinker } from './CommandGroupLinker'
import { UnitSelectorDrawer } from './UnitSelectorDrawer'
import { Plus, Swords, Crown, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Commander cluster: side-by-side [commander | warrior] ────────────────────

function CommanderCluster({
  cmdGroup,
  linkedWarrior,
  validationErrors,
}: {
  cmdGroup: Group
  linkedWarrior: Group | null
  validationErrors: ValidationError[]
}) {
  const ut = unitTypeById[cmdGroup.unitTypeId]
  const warriorUt = linkedWarrior ? unitTypeById[linkedWarrior.unitTypeId] : null
  const cmdCost = computeGroupCost(cmdGroup)
  const warriorCost = linkedWarrior ? computeGroupCost(linkedWarrior) : 0
  const clusterCost = cmdCost + warriorCost
  const displayName = cmdGroup.commander?.name || ut?.name || 'Commander'

  const clusterErrors = validationErrors.filter(
    e => e.groupId === cmdGroup.id || (linkedWarrior && e.groupId === linkedWarrior.id)
  )
  const hasErrors  = clusterErrors.some(e => e.severity === 'error')
  const hasWarnings = clusterErrors.some(e => e.severity === 'warning')

  return (
    <div className={cn(
      'rounded-lg border border-border bg-muted/20 overflow-hidden flex flex-col h-full',
      hasErrors   && 'ring-1 ring-destructive/50',
      hasWarnings && !hasErrors && 'ring-1 ring-yellow-500/30',
    )}>

      {/* ── Cluster header ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/60 border-b border-border shrink-0">
        <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold text-sm min-w-0 truncate">
          {displayName}
        </span>
        {linkedWarrior && warriorUt ? (
          <>
            <Link2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <span className="text-sm text-muted-foreground min-w-0 truncate">
              {linkedWarrior.count}× {warriorUt.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-yellow-600/70 italic">no command group</span>
        )}
        <div className="flex-1" />
        {linkedWarrior && (
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {cmdCost} + {warriorCost} =
          </span>
        )}
        <span className="text-sm font-bold tabular-nums text-primary shrink-0">{clusterCost} pts</span>
      </div>

      {/* ── Side-by-side body (flex-1 fills remaining height) ── */}
      <div className="flex flex-1 min-h-0">

        {/* Commander card (left half) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <GroupCard
            group={cmdGroup}
            validationErrors={validationErrors}
            linkedWarriorGroup={linkedWarrior}
            embedded
            compact
            hideLinker
            fillHeight
          />
        </div>

        {/* Divider with link icon */}
        <div className="relative w-px bg-border/50 self-stretch shrink-0 flex items-center justify-center overflow-visible">
          <div className="absolute w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center z-10 shadow-sm">
            <Link2 className="h-3 w-3 text-muted-foreground/40" />
          </div>
        </div>

        {/* Warrior card or attach panel (right half) */}
        <div className="flex-1 min-w-0 flex flex-col">
          {linkedWarrior ? (
            <GroupCard
              group={linkedWarrior}
              validationErrors={validationErrors}
              nested
              embedded
              compact
              fillHeight
            />
          ) : (
            <CommandGroupLinker commanderGroup={cmdGroup} panelMode />
          )}
        </div>

      </div>
    </div>
  )
}

// ── Main GroupList ────────────────────────────────────────────────────────────

export function GroupList() {
  const { retinue, validationErrors } = useRetinue()
  const activePanel = useUIStore(s => s.activePanel)
  const openPanel = useUIStore(s => s.openPanel)
  const closePanel = useUIStore(s => s.closePanel)

  const drawerOpen = activePanel === 'add_group'

  const commanderGroups = retinue.groups.filter(
    g => unitTypeById[g.unitTypeId]?.isCommander
  )
  const linkedWarriorIds = new Set(
    retinue.groups.filter(g => g.commanderGroupId !== null).map(g => g.id)
  )
  const standaloneWarriorGroups = retinue.groups.filter(
    g => !unitTypeById[g.unitTypeId]?.isCommander && !linkedWarriorIds.has(g.id)
  )

  const isEmpty = retinue.groups.length === 0

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">

          <div className="mb-4">
            <button
              onClick={() => openPanel('add_group')}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Group
            </button>
          </div>

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
              <Swords className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/60">No groups yet — add a Commander to start.</p>
            </div>
          ) : (
            // Single unified grid — clusters span 2 cols, standalones span 1
            // CSS grid stretch equalises heights within each row automatically
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[1100px] mx-auto w-full">

              {commanderGroups.map(cmdGroup => {
                const linkedWarrior = retinue.groups.find(
                  g => g.commanderGroupId === cmdGroup.id
                ) ?? null
                return (
                  <div key={cmdGroup.id} className="col-span-1 sm:col-span-2 flex flex-col">
                    <CommanderCluster
                      cmdGroup={cmdGroup}
                      linkedWarrior={linkedWarrior}
                      validationErrors={validationErrors}
                    />
                  </div>
                )
              })}

              {standaloneWarriorGroups.map(group => (
                <div key={group.id} className="flex flex-col">
                  <GroupCard
                    group={group}
                    validationErrors={validationErrors}
                    fillHeight
                  />
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      <UnitSelectorDrawer open={drawerOpen} onClose={closePanel} />
    </>
  )
}
