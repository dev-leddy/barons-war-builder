'use client'

import { useRetinueStore } from '@/src/store/retinueStore'
import { useUIStore } from '@/src/store/uiStore'
import { useRetinue } from '@/src/hooks/useRetinue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Save, Share2, Printer, FolderOpen, FilePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function Header() {
  const { retinue, totalCost } = useRetinue()
  const setRetinueName = useRetinueStore(s => s.setRetinueName)
  const setPointsLimit = useRetinueStore(s => s.setPointsLimit)
  const resetRetinue = useRetinueStore(s => s.resetRetinue)
  const openPanel = useUIStore(s => s.openPanel)
  const router = useRouter()

  const pct = Math.min(100, (totalCost / retinue.pointsLimit) * 100)
  const isOver = totalCost > retinue.pointsLimit

  function handleNewRetinue() {
    if (retinue.groups.length > 0) {
      if (!confirm('Start a new retinue? Unsaved changes will be lost.')) return
    }
    resetRetinue()
  }

  function handleSetPointsLimit() {
    const val = prompt('Set points limit:', String(retinue.pointsLimit))
    if (val) {
      const n = parseInt(val, 10)
      if (!isNaN(n) && n > 0) setPointsLimit(n)
    }
  }

  return (
    <header className="shrink-0 border-b border-white/8" style={{ background: 'oklch(0.19 0.018 250)' }}>
      <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
        {/* Name + actions row */}
        <div className="flex items-center gap-2">
          <Input
            value={retinue.name}
            onChange={e => setRetinueName(e.target.value)}
            className="font-heading text-base h-9 bg-transparent border-transparent hover:border-white/20 focus:border-white/40 px-1 flex-1 min-w-0 text-white placeholder:text-white/40"
            placeholder="Retinue Name"
            aria-label="Retinue name"
          />
          <div className="flex gap-1 shrink-0">
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
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Points bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">
              Points:{' '}
              <span className={cn('font-semibold', isOver ? 'text-red-400' : 'text-white/90')}>
                {totalCost}
              </span>
              {' / '}
              <button
                className="underline underline-offset-2 text-white/50 hover:text-white/90 focus:outline-none rounded"
                onClick={handleSetPointsLimit}
                aria-label={`Points limit: ${retinue.pointsLimit}. Click to change.`}
              >
                {retinue.pointsLimit}
              </button>
              {' pts'}
            </span>
            <span className={cn('font-semibold text-xs', isOver ? 'text-red-400' : 'text-white/40')}>
              {isOver
                ? `${totalCost - retinue.pointsLimit} over limit`
                : `${retinue.pointsLimit - totalCost} remaining`}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'oklch(0.30 0.015 250)' }}
            role="progressbar"
            aria-valuenow={totalCost}
            aria-valuemin={0}
            aria-valuemax={retinue.pointsLimit}
            aria-label="Points used"
          >
            <div
              className={cn('h-full rounded-full transition-all duration-300', isOver ? 'bg-red-500' : '')}
              style={isOver ? { width: `${pct}%` } : { width: `${pct}%`, background: 'oklch(0.78 0.14 80)' }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
