'use client'

import { UNIT_TYPES } from '@/src/data/unitTypes'
import type { UnitType } from '@/src/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const ROLE_LABELS: Record<string, string> = {
  commander: 'Commander',
  cavalry: 'Cavalry',
  infantry: 'Infantry',
  ranged: 'Ranged',
  support: 'Support',
}

const ROLE_COLORS: Record<string, string> = {
  commander: 'border-[var(--chart-1)] bg-[var(--chart-1)]/10',
  cavalry:   'border-[var(--chart-2)] bg-[var(--chart-2)]/10',
  infantry:  'border-[var(--chart-3)] bg-[var(--chart-3)]/10',
  ranged:    'border-[var(--chart-4)] bg-[var(--chart-4)]/10',
  support:   'border-[var(--chart-5)] bg-[var(--chart-5)]/10',
}

const TIER_ICONS: Record<number, string> = { 3: '♛♛♛', 2: '♛♛', 1: '♛' }

interface Props {
  selected: string | null
  onSelect: (unitTypeId: string) => void
  filter?: string
}

const FILTERS = ['all', 'commander', 'cavalry', 'infantry', 'ranged', 'support'] as const
type Filter = typeof FILTERS[number]

export function UnitTypePicker({ selected, onSelect, filter: externalFilter }: Props) {
  const activeFilter = (externalFilter ?? 'all') as Filter

  const visible = UNIT_TYPES.filter(u =>
    activeFilter === 'all' || u.role === activeFilter
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map(unitType => (
          <UnitTypeCard
            key={unitType.id}
            unitType={unitType}
            isSelected={selected === unitType.id}
            onSelect={() => onSelect(unitType.id)}
          />
        ))}
      </div>
    </div>
  )
}

function UnitTypeCard({
  unitType,
  isSelected,
  onSelect,
}: {
  unitType: UnitType
  isSelected: boolean
  onSelect: () => void
}) {
  const roleColor = ROLE_COLORS[unitType.role] ?? ''
  const costs = Object.values(unitType.baseCosts).filter(Boolean)
  const minCost = Math.min(...costs as number[])
  const maxCost = Math.max(...costs as number[])
  const costLabel = minCost === maxCost ? `${minCost} pts` : `${minCost}–${maxCost} pts`

  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left rounded-lg border-2 p-3 transition-all',
        roleColor,
        isSelected
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {unitType.isCommander && (
              <span className="text-[var(--chart-1)] text-xs leading-none" title={`Tier ${unitType.tier}`}>
                {TIER_ICONS[unitType.tier]}
              </span>
            )}
            <span className="font-semibold text-sm truncate">{unitType.name}</span>
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
              {ROLE_LABELS[unitType.role]}
            </Badge>
            {unitType.isMounted && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">Mounted</Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
          {costLabel}
        </span>
      </div>
      {unitType.inherentAbilities.length > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground truncate">
          {unitType.inherentAbilities.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(' · ')}
        </p>
      )}
    </button>
  )
}

export function RoleFilter({
  active,
  onChange,
}: {
  active: string
  onChange: (f: string) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
            active === f
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          {f === 'all' ? 'All' : ROLE_LABELS[f]}
        </button>
      ))}
    </div>
  )
}
