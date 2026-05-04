'use client'

import type { Group } from '@/src/types'
import { computeGroupCost, computeCostPerWarrior } from '@/src/logic/costs'
import { unitTypeById } from '@/src/data/unitTypes'

interface Props {
  group: Group
}

export function CostSummary({ group }: Props) {
  const unitType = unitTypeById[group.unitTypeId]
  const total = computeGroupCost(group)
  const isWarrior = unitType && !unitType.isCommander

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Group Total</span>
        <span className="text-xl font-bold text-primary">{total} pts</span>
      </div>
      {isWarrior && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {computeCostPerWarrior(group)} pts × {group.count} warriors
        </p>
      )}
    </div>
  )
}
