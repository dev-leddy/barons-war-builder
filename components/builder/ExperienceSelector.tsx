'use client'

import type { UnitType, Experience } from '@/src/types'
import { cn } from '@/lib/utils'

const EXP_LABELS: Record<Experience, string> = {
  green: 'Green',
  irregular: 'Irregular',
  regular: 'Regular',
  veteran: 'Veteran',
}

const EXP_ORDER: Experience[] = ['green', 'irregular', 'regular', 'veteran']

interface Props {
  unitType: UnitType
  selected: Experience
  onChange: (exp: Experience) => void
}

export function ExperienceSelector({ unitType, selected, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Experience
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {EXP_ORDER.map(exp => {
          const available = unitType.experienceOptions.includes(exp)
          const cost = unitType.baseCosts[exp]
          return (
            <button
              key={exp}
              disabled={!available}
              onClick={() => available && onChange(exp)}
              className={cn(
                'flex flex-col items-center rounded-md border px-2 py-2 text-center transition-all',
                available
                  ? selected === exp
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border hover:border-primary/50 text-foreground'
                  : 'border-border/30 opacity-30 cursor-not-allowed text-muted-foreground'
              )}
            >
              <span className="text-xs font-semibold">{EXP_LABELS[exp]}</span>
              {cost !== undefined ? (
                <span className="text-xs text-muted-foreground">{cost} pts</span>
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
