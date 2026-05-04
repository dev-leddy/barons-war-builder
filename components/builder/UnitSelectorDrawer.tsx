'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { X, Crown, BookOpen, Shield, Sword, Crosshair, Users } from 'lucide-react'
import { UNIT_TYPES, unitTypeById } from '@/src/data/unitTypes'
import { abilityById } from '@/src/data/abilities'
import { useRetinueStore } from '@/src/store/retinueStore'
import { useUIStore } from '@/src/store/uiStore'
import { defaultEquipment } from '@/src/logic/equipment'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Group, Commander, Experience } from '@/src/types'

const ROLE_LABELS: Record<string, string> = {
  commander: 'Commanders',
  cavalry:   'Cavalry',
  infantry:  'Infantry',
  ranged:    'Ranged',
  support:   'Support',
}

const ROLE_ORDER = ['commander', 'cavalry', 'infantry', 'ranged', 'support']

const ROLE_IMG_BG: Record<string, string> = {
  commander: 'bg-amber-100 text-amber-800 border-amber-300',
  cavalry:   'bg-red-100 text-red-800 border-red-300',
  infantry:  'bg-blue-100 text-blue-800 border-blue-300',
  ranged:    'bg-green-100 text-green-800 border-green-300',
  support:   'bg-stone-100 text-stone-600 border-stone-300',
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  commander: <Crown className="h-5 w-5" />,
  cavalry:   <Sword className="h-5 w-5" />,
  infantry:  <Shield className="h-5 w-5" />,
  ranged:    <Crosshair className="h-5 w-5" />,
  support:   <Users className="h-5 w-5" />,
}

const TIER_LABEL: Record<number, string> = { 3: '♛♛♛', 2: '♛♛', 1: '♛' }

const UNIT_IMAGES: Record<string, string> = {
  baron_mounted:              '/units/mountedbaron.png',
  lord_foot:                  '/units/lord.png',
  lord_mounted:               '/units/mounted-lord.png',
  serjeant_at_arms_mounted:   '/units/Mounted-serjeant-at-arms.png',
  knights:                    '/units/knights.png',
  mounted_knights:            '/units/mounted-knights.png',
  serjeants:                  '/units/serjeants.png',
  marksman_serjeants:         '/units/marksman-serjeants.png',
  mounted_serjeants:          '/units/mounted-serjeants.png',
  bowmen:                     '/units/bowmen.png',
  crossbowmen:                '/units/crossbowmen.png',
  spearmen:                   '/units/spearmen.png',
  militant_monks:             '/units/militant-monks.png',
  levy:                       '/units/levy.png',
}

function makeDefaultCommander(unitTypeId: string, experience: Experience): Commander {
  const ut = unitTypeById[unitTypeId]!
  return {
    id: uuid(),
    name: '',
    unitTypeId,
    experience,
    equipment: defaultEquipment(ut, experience),
    purchasedAbilities: [],
    isRetinueLeader: false,
    isKnightCommander: false,
    knightCommanderData: null,
    isDramatisPersonae: false,
    dramatisPersonaeId: null,
  }
}

export function makeDefaultGroup(unitTypeId: string): Group {
  const ut = unitTypeById[unitTypeId]!
  const experience: Experience = ut.experienceOptions.includes('regular')
    ? 'regular'
    : ut.experienceOptions[0]
  const minSize = ut.minGroupSize ?? (ut.isMounted ? 2 : 4)
  const count = ut.isCommander ? 1 : minSize

  return {
    id: uuid(),
    unitTypeId,
    experience,
    count,
    isCommandGroup: ut.isCommander,
    commandGroupUpgrade: { banner: false, pennant: false, musician: false, priest: false },
    equipment: defaultEquipment(ut, experience),
    purchasedAbilities: [],
    commander: ut.isCommander ? makeDefaultCommander(unitTypeId, experience) : null,
    commanderGroupId: null,
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function UnitSelectorDrawer({ open, onClose }: Props) {
  const [filter, setFilter] = useState('all')
  const addGroup = useRetinueStore(s => s.addGroup)
  const openPanel = useUIStore(s => s.openPanel)

  if (!open) return null

  const handleAdd = (unitTypeId: string) => {
    addGroup(makeDefaultGroup(unitTypeId))
    onClose()
  }

  const visibleRoles = ROLE_ORDER.filter(role =>
    filter === 'all' || filter === role
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Centered popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-5xl h-[88vh] bg-card rounded-xl border border-border shadow-2xl flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="font-heading text-lg font-semibold">Add Group</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Role filter tabs */}
          <div className="px-5 py-3 border-b border-border shrink-0 flex flex-wrap gap-1.5">
            {(['all', ...ROLE_ORDER] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors capitalize',
                  filter === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                )}
              >
                {r === 'all' ? 'All' : ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Unit grid — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-muted/30">
            {visibleRoles.map(role => {
              const units = UNIT_TYPES.filter(u => u.role === role)
              if (units.length === 0) return null

              return (
                <section key={role}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {ROLE_LABELS[role]}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {units.map(ut => {
                      const refExp = ut.experienceOptions.includes('regular')
                        ? 'regular'
                        : ut.experienceOptions[0]
                      const baseCost = ut.baseCosts[refExp] ?? Object.values(ut.baseCosts).find(Boolean)

                      const stats = ut.stats[refExp]

                      return (
                        <button
                          key={ut.id}
                          onClick={() => handleAdd(ut.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/80 bg-card shadow-sm hover:bg-accent/50 hover:border-primary/40 hover:shadow-md transition-all text-left"
                        >
                          {/* Name + points */}
                          <div className="flex items-start justify-between gap-1 w-full min-h-[2.75rem]">
                            <span className="text-base font-semibold leading-tight">{ut.name}</span>
                            <span className="text-sm text-muted-foreground shrink-0 tabular-nums">{baseCost} pts</span>
                          </div>

                          {/* Icon */}
                          <div className={cn(
                            'w-[100px] h-[100px] rounded-full shrink-0 overflow-hidden border-2',
                            ROLE_IMG_BG[ut.role]
                          )}>
                            {UNIT_IMAGES[ut.id]
                              ? (
                                <img
                                  src={UNIT_IMAGES[ut.id]}
                                  alt={ut.name}
                                  className="w-full h-full object-contain scale-90"
                                />
                              )
                              : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {ut.isCommander
                                    ? <span className="text-base font-bold leading-none">{TIER_LABEL[ut.tier]}</span>
                                    : ROLE_ICONS[ut.role]
                                  }
                                </div>
                              )
                            }
                          </div>

                          {/* Details */}
                          <div className="w-full min-w-0">
                            {/* Stats mini-table */}
                            {stats && (() => {
                              const cols = [
                                { label: 'MV',  value: `${stats.move}"` },
                                { label: 'ATT', value: stats.attack },
                                { label: 'DEF', value: stats.defence },
                                { label: 'MOR', value: stats.morale },
                                ...(stats.actions > 1 ? [{ label: 'ACT', value: String(stats.actions) }] : []),
                              ]
                              return (
                                <div className="mb-1.5 rounded-md border border-border/60 bg-secondary/30 overflow-hidden grid divide-x divide-border/40"
                                  style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
                                >
                                  {cols.map(({ label, value }) => (
                                    <div key={label} className="flex flex-col items-center justify-center py-2 gap-0.5">
                                      <span className="text-[9px] uppercase tracking-wider text-foreground/70 leading-none font-medium">{label}</span>
                                      <span className="text-sm font-bold text-primary leading-tight tabular-nums">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ut.inherentAbilities.map(id => {
                                const ab = abilityById[id]
                                if (!ab?.description) {
                                  return (
                                    <span key={id} className="px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border/60">
                                      {ab?.name ?? id.replace(/_ability$/, '').replace(/_/g, ' ')}
                                    </span>
                                  )
                                }
                                return (
                                  <Tooltip key={id}>
                                    <TooltipTrigger
                                      render={<span />}
                                      onClick={e => e.stopPropagation()}
                                      className="cursor-default px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border/60"
                                    >
                                      {ab.name}
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs" side="top">{ab.description}</TooltipContent>
                                  </Tooltip>
                                )
                              })}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* Custom section */}
            {(filter === 'all' || filter === 'commander') && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Custom Commanders
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { openPanel('knight_commander'); onClose() }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2 mt-0.5 bg-amber-900/20 text-amber-600 border-amber-600/40">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold leading-tight block">Knight Commander</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Custom Baron or Lord</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { openPanel('dramatis_personae'); onClose() }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2 mt-0.5 bg-purple-900/20 text-purple-600 border-purple-600/40">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold leading-tight block">Dramatis Personae</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Named historical characters</p>
                    </div>
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
