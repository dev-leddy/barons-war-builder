'use client'

import { useState } from 'react'
import type { UnitType, Experience } from '@/src/types'
import { getAvailableAbilities } from '@/src/logic/abilities'
import { abilityById } from '@/src/data/abilities'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  unitType: UnitType
  experience: Experience
  isRetinueLeader: boolean
  hasArmour: boolean
  hasBowOrCrossbow: boolean
  selected: string[]
  onChange: (ids: string[]) => void
}

export function AbilitiesSection({
  unitType,
  experience,
  isRetinueLeader,
  hasArmour,
  hasBowOrCrossbow,
  selected,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const available = getAvailableAbilities({
    unitType,
    experience,
    isRetinueLeader,
    isMounted: unitType.isMounted,
    hasArmour,
    hasBowOrCrossbow,
    unitTypeId: unitType.id,
  })

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(a => a !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const totalAbilityCost = selected.reduce((sum, id) => {
    return sum + (abilityById[id]?.cost ?? 0)
  }, 0)

  return (
    <div className="space-y-2">
      <button
        className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider"
        onClick={() => setExpanded(e => !e)}
      >
        <span>
          Purchased Abilities
          {selected.length > 0 && (
            <span className="ml-1.5 text-primary">
              ({selected.length} selected · +{totalAbilityCost} pts/warrior)
            </span>
          )}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {available.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              No abilities available for this selection.
            </p>
          )}
          {available.map(ability => {
            const isSelected = selected.includes(ability.id)
            return (
              <Tooltip key={ability.id}>
                <TooltipTrigger
                  onClick={() => toggle(ability.id)}
                  className={cn(
                    'text-left px-3 py-2 rounded-md border text-sm transition-all w-full',
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:border-primary/50 text-foreground'
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{ability.name}</span>
                    <span className="text-muted-foreground shrink-0">+{ability.cost}/w</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs" side="right">
                  {ability.description}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}
    </div>
  )
}
