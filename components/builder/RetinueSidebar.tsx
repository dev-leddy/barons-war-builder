'use client'

import { useState } from 'react'
import { useRetinue } from '@/src/hooks/useRetinue'
import { useUIStore } from '@/src/store/uiStore'
import { useRetinueStore } from '@/src/store/retinueStore'
import { unitTypeById } from '@/src/data/unitTypes'
import { FACTIONS } from '@/src/data/factions'
import type { FactionId } from '@/src/data/factions'
import {
  CheckCircle, XCircle, AlertTriangle,
  Save, FolderOpen, Share2, Printer, FilePlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

export function RetinueSidebar() {
  const { retinue, totalCost, errors, warnings, isValid } = useRetinue()
  const openPanel = useUIStore(s => s.openPanel)
  const setRetinueName = useRetinueStore(s => s.setRetinueName)
  const setFaction = useRetinueStore(s => s.setFaction)
  const setPointsLimit = useRetinueStore(s => s.setPointsLimit)
  const resetRetinue = useRetinueStore(s => s.resetRetinue)
  const router = useRouter()

  const remaining = retinue.pointsLimit - totalCost
  const isOver = totalCost > retinue.pointsLimit
  const pct = Math.min(100, (totalCost / retinue.pointsLimit) * 100)

  const commanderGroups = retinue.groups.filter(g => {
    const ut = unitTypeById[g.unitTypeId]
    return ut?.isCommander
  })
  const warriorGroups = retinue.groups.filter(g => {
    const ut = unitTypeById[g.unitTypeId]
    return !ut?.isCommander
  })
  const totalWarriors = warriorGroups.reduce((sum, g) => sum + g.count, 0)
  const retinueLeader = retinue.groups.find(g => g.commander?.isRetinueLeader)
  const leaderName = retinueLeader
    ? (retinueLeader.commander?.name || unitTypeById[retinueLeader.unitTypeId]?.name || '—')
    : '—'

  function handleSetPointsLimit() {
    const val = prompt('Set points limit:', String(retinue.pointsLimit))
    if (val) {
      const n = parseInt(val, 10)
      if (!isNaN(n) && n > 0) setPointsLimit(n)
    }
  }

  function handleNewRetinue() {
    if (retinue.groups.length > 0) {
      if (!confirm('Start a new retinue? Unsaved changes will be lost.')) return
    }
    resetRetinue()
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-card overflow-y-auto">

      {/* Faction selector */}
      <div className="px-3 pt-3 pb-2 border-b border-border/50">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-1.5">Faction</p>
        <select
          value={retinue.faction}
          onChange={e => {
            const next = e.target.value as FactionId
            if (next === retinue.faction) return
            const hasGroups = retinue.groups.length > 0
            if (hasGroups && !confirm('Changing faction will clear all groups. Continue?')) return
            setFaction(next)
          }}
          className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {FACTIONS.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Retinue name */}
      <div className="px-3 pt-3 pb-2 border-b border-border/50">
        <Input
          value={retinue.name}
          onChange={e => setRetinueName(e.target.value)}
          className="font-heading text-sm h-8 bg-transparent border-transparent hover:border-border focus:border-primary px-1 w-full"
          placeholder="Retinue Name"
          aria-label="Retinue name"
        />
        {/* Action icons */}
        <div className="flex gap-0.5 mt-1.5 justify-end">
          {[
            { icon: FilePlus, label: 'New Retinue', action: handleNewRetinue },
            { icon: FolderOpen, label: 'Load', action: () => openPanel('load') },
            { icon: Save, label: 'Save', action: () => openPanel('save') },
            { icon: Share2, label: 'Share', action: () => openPanel('share') },
            { icon: Printer, label: 'Print / Save PDF', action: () => router.push(`/print?id=${retinue.id}`) },
          ].map(({ icon: Icon, label, action }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                onClick={action}
                className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="px-3 py-3 border-b border-border/50 space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">Points</p>

        <div className="flex items-end justify-between">
          <span className={cn('text-2xl font-bold tabular-nums leading-none', isOver ? 'text-destructive' : 'text-foreground')}>
            {totalCost}
          </span>
          <button
            onClick={handleSetPointsLimit}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 leading-none mb-0.5"
          >
            / {retinue.pointsLimit} pts
          </button>
        </div>

        {/* Points bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden bg-secondary"
          role="progressbar"
          aria-valuenow={totalCost}
          aria-valuemin={0}
          aria-valuemax={retinue.pointsLimit}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-300', isOver ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className={cn('text-xs', isOver ? 'text-destructive' : 'text-muted-foreground')}>
          {isOver
            ? `${totalCost - retinue.pointsLimit} pts over limit`
            : `${remaining} pts remaining`}
        </p>
      </div>

      {/* Retinue overview */}
      <div className="px-3 py-3 border-b border-border/50 space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">Overview</p>
        <div className="space-y-1.5">
          {[
            { label: 'Groups', value: retinue.groups.length },
            { label: 'Commanders', value: commanderGroups.length },
            { label: 'Warriors', value: totalWarriors },
            { label: 'Retinue Leader', value: leaderName },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-semibold text-foreground text-right max-w-[100px] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation */}
      <div className="px-3 py-3 flex-1 space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">Validation</p>
        {isValid && warnings.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            Retinue is valid
          </div>
        ) : (
          <div className="space-y-1.5">
            {errors.map((e, i) => (
              <div key={i} className="flex gap-1.5 items-start text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                <span className="leading-tight">{e.message}</span>
              </div>
            ))}
            {warnings.map((w, i) => (
              <div key={i} className="flex gap-1.5 items-start text-xs text-yellow-500">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                <span className="leading-tight">{w.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
