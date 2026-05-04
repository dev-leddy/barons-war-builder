'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import type {
  KnightCommanderData, GroupEquipment, Commander, Group,
  CommandGroupUpgrade, MeleeWeaponId, ShieldId, MountId,
} from '@/src/types'
import { computeKnightCommanderCost, computeEquipmentCost } from '@/src/logic/costs'
import { useRetinueStore } from '@/src/store/retinueStore'
import { useUIStore } from '@/src/store/uiStore'
import { ABILITIES } from '@/src/data/abilities'
import { weaponById, shieldById, mountById } from '@/src/data/equipment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { X, Plus, Minus } from 'lucide-react'

// ── Constants (PDF pp.130–131) ───────────────────────────────────────────────

const MAX_UPGRADES = { baron: 8, lord: 5 } as const
const MAX_EXTRA_ABILITIES = { baron: 3, lord: 2 } as const

// Base stats (starting point before upgrades)
const BASE = { attack: 6, defence: 7, morale: 4 }
// Minimum floors (can't upgrade past these)
const FLOOR = { attack: 3, defence: 5, morale: 2 }
// Max upgrades per stat
const MAX_PER_STAT = {
  attack: BASE.attack - FLOOR.attack,   // 3
  defence: BASE.defence - FLOOR.defence, // 2
  morale: BASE.morale - FLOOR.morale,   // 2
}

// Purchasable abilities available for KCs (excludes unit-type-specific restrictions)
const KC_ABILITIES = ABILITIES.filter(a =>
  !a.isInherent &&
  !a.restrictions.includes('mounted_knights_only') &&
  !a.restrictions.includes('bow_or_crossbow_only') &&
  !a.restrictions.includes('unarmoured_only')
)

// Live by the Sword — inherent ability, optional for KC (+1 pt)
const LBTS_ID = 'live_by_the_sword'

// Melee weapon options by type
const DISMOUNTED_MELEE: MeleeWeaponId[] = ['sword', 'mace', 'falchion', 'two_handed_weapon']
const MOUNTED_MELEE: MeleeWeaponId[] = ['sword', 'mace', 'falchion', 'horsemans_pick']
const SHIELD_OPTIONS: ShieldId[] = ['medium_shield', 'large_shield']
const MOUNT_OPTIONS: MountId[] = ['horse', 'barded_horse']

// ── State ────────────────────────────────────────────────────────────────────

interface WizardState {
  baseType: 'baron' | 'lord'
  isMounted: boolean
  name: string
  statUpgrades: { attack: number; defence: number; morale: number }
  hasLiveByTheSword: boolean
  extraAbilities: string[]
  meleeWeapon: MeleeWeaponId
  hasLance: boolean
  shield: ShieldId | null
  mount: MountId
  cgBanner: boolean
  cgPennant: boolean
  cgMusician: boolean
  cgPriest: boolean
}

function makeDefault(): WizardState {
  return {
    baseType: 'baron',
    isMounted: false,
    name: '',
    statUpgrades: { attack: 0, defence: 0, morale: 0 },
    hasLiveByTheSword: false,
    extraAbilities: [],
    meleeWeapon: 'sword',
    hasLance: false,
    shield: 'medium_shield',
    mount: 'horse',
    cgBanner: false,
    cgPennant: false,
    cgMusician: false,
    cgPriest: false,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statLabel(base: number, upgrades: number) {
  return `${base - upgrades}+`
}

function totalUpgrades(su: WizardState['statUpgrades']) {
  return su.attack + su.defence + su.morale
}

function buildEquipment(w: WizardState): GroupEquipment {
  const isTWH = w.meleeWeapon === 'two_handed_weapon'
  return {
    meleeWeapon: w.meleeWeapon,
    rangedWeapon: w.isMounted && w.hasLance ? 'lance' as unknown as null : null, // Lance stored separately
    armour: 'mail',
    shield: isTWH ? null : (w.shield ?? null),
    mount: w.isMounted ? w.mount : null,
  }
}

function computeWizardCost(w: WizardState): number {
  const kcData: KnightCommanderData = {
    baseType: w.baseType,
    statUpgrades: w.statUpgrades,
    extraAbilities: buildExtraAbilities(w),
  }
  const equip = buildEquipment(w)
  // computeKnightCommanderCost: base + upgrades + chivalry(1) + equip
  let cost = computeKnightCommanderCost(kcData, equip)
  // LBTS (+1) if chosen
  if (w.hasLiveByTheSword) cost += 1
  // Lance (+4) if mounted and has lance
  if (w.isMounted && w.hasLance) cost += weaponById['lance']?.cost ?? 4
  // CG Upgrades
  if (w.cgBanner) cost += 9
  if (w.cgPennant) cost += 7
  if (w.cgMusician) cost += 4
  if (w.cgPriest) cost += 4
  return cost
}

function buildExtraAbilities(w: WizardState): string[] {
  const abilities = [...w.extraAbilities]
  if (w.hasLiveByTheSword) abilities.push(LBTS_ID)
  return abilities
}

function unitTypeId(w: WizardState): string {
  if (w.baseType === 'baron') return w.isMounted ? 'baron_mounted' : 'baron_foot'
  return w.isMounted ? 'lord_mounted' : 'lord_foot'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KnightCommanderWizard() {
  const closePanel = useUIStore(s => s.closePanel)
  const addGroup = useRetinueStore(s => s.addGroup)
  const [w, setW] = useState<WizardState>(makeDefault)

  const upd = (patch: Partial<WizardState>) => setW(prev => {
    const next = { ...prev, ...patch }
    // If switching to dismounted, clear lance and mount; reset melee weapon if needed
    if ('isMounted' in patch && !patch.isMounted) {
      next.hasLance = false
      next.mount = 'horse'
      if (!DISMOUNTED_MELEE.includes(next.meleeWeapon)) next.meleeWeapon = 'sword'
    }
    // If TWH selected, clear shield
    if ('meleeWeapon' in patch && patch.meleeWeapon === 'two_handed_weapon') {
      next.shield = null
      next.hasLance = false
    }
    return next
  })

  const usedUpgrades = totalUpgrades(w.statUpgrades)
  const maxUpgrades = MAX_UPGRADES[w.baseType]
  const usedAbilities = w.extraAbilities.length
  const maxAbilities = MAX_EXTRA_ABILITIES[w.baseType]
  const isTWH = w.meleeWeapon === 'two_handed_weapon'
  const totalCost = computeWizardCost(w)

  function changeUpgrade(stat: keyof WizardState['statUpgrades'], delta: number) {
    const cur = w.statUpgrades[stat]
    const next = cur + delta
    if (next < 0 || next > MAX_PER_STAT[stat]) return
    if (delta > 0 && usedUpgrades >= maxUpgrades) return
    setW(prev => ({
      ...prev,
      statUpgrades: { ...prev.statUpgrades, [stat]: next },
    }))
  }

  function toggleAbility(id: string) {
    const sel = w.extraAbilities
    if (sel.includes(id)) {
      upd({ extraAbilities: sel.filter(a => a !== id) })
    } else if (sel.length < maxAbilities) {
      upd({ extraAbilities: [...sel, id] })
    }
  }

  function handleAddToRetinue() {
    const equip = buildEquipment(w)
    const extraAbilities = buildExtraAbilities(w)

    const kcData: KnightCommanderData = {
      baseType: w.baseType,
      statUpgrades: w.statUpgrades,
      extraAbilities,
    }

    const commanderObj: Commander = {
      id: uuid(),
      name: w.name.trim() || `Knight ${w.baseType === 'baron' ? 'Baron' : 'Lord'}`,
      unitTypeId: unitTypeId(w),
      experience: 'regular',
      equipment: equip,
      purchasedAbilities: extraAbilities,
      isRetinueLeader: false,
      isKnightCommander: true,
      knightCommanderData: kcData,
      isDramatisPersonae: false,
      dramatisPersonaeId: null,
    }

    const cgUpgrade: CommandGroupUpgrade = {
      banner: w.baseType === 'baron' ? w.cgBanner : false,
      pennant: w.baseType === 'lord' ? w.cgPennant : false,
      musician: w.cgMusician,
      priest: w.cgPriest,
    }

    const group: Group = {
      id: uuid(),
      unitTypeId: unitTypeId(w),
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commandGroupUpgrade: cgUpgrade,
      equipment: equip,
      purchasedAbilities: extraAbilities,
      commander: commanderObj,
      commanderGroupId: null,
    }

    addGroup(group)
    setW(makeDefault())
    closePanel()
  }

  const tierCrowns = w.baseType === 'baron' ? '♛♛♛' : '♛♛'

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-card border-l border-border shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="font-semibold text-base leading-none">
            <span className="text-[var(--chart-1)] mr-1.5">{tierCrowns}</span>
            Knight Commander Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">PDF pp.130–131</p>
        </div>
        <button onClick={closePanel} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Type & Name ── */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</h3>

          <div className="grid grid-cols-2 gap-2">
            {(['baron', 'lord'] as const).map(type => (
              <button
                key={type}
                onClick={() => upd({
                  baseType: type,
                  extraAbilities: [],
                  cgBanner: false,
                  cgPennant: false,
                })}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm text-left transition-all',
                  w.baseType === type
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                <div className="font-medium capitalize">{type}</div>
                <div className="text-xs text-muted-foreground">
                  Base {type === 'baron' ? 27 : 17}pts · Max {MAX_UPGRADES[type]} upgrades · {MAX_EXTRA_ABILITIES[type]} abilities
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => upd({ isMounted: !w.isMounted })}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-all',
                w.isMounted
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              )}
            >
              {w.isMounted ? '🐴 Mounted' : '⚔ Dismounted'}
            </button>
          </div>

          <Input
            placeholder="Commander name (optional)"
            value={w.name}
            onChange={e => upd({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </section>

        {/* ── Stat Upgrades ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stat Upgrades</h3>
            <span className={cn(
              'text-xs font-medium',
              usedUpgrades >= maxUpgrades ? 'text-primary' : 'text-muted-foreground'
            )}>
              {usedUpgrades} / {maxUpgrades} used
            </span>
          </div>

          {(['attack', 'defence', 'morale'] as const).map(stat => {
            const base = BASE[stat]
            const upgrades = w.statUpgrades[stat]
            const maxStat = MAX_PER_STAT[stat]
            const costPerUpgrade = stat === 'morale' ? 1 : 2
            const canIncrease = upgrades < maxStat && usedUpgrades < maxUpgrades
            const canDecrease = upgrades > 0

            return (
              <div key={stat} className="flex items-center gap-3">
                <span className="text-sm capitalize w-16 text-muted-foreground">{stat}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeUpgrade(stat, -1)}
                    disabled={!canDecrease}
                    className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-base font-bold w-8 text-center">{statLabel(base, upgrades)}</span>
                  <button
                    onClick={() => changeUpgrade(stat, 1)}
                    disabled={!canIncrease}
                    className="h-6 w-6 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  {upgrades > 0 && `+${upgrades * costPerUpgrade}pts`}
                  {upgrades === 0 && <span className="opacity-50">{costPerUpgrade}pts each</span>}
                </span>
              </div>
            )
          })}

          <p className="text-xs text-muted-foreground">
            Base: Att 6+ · Def 7+ · Mor 4+ &nbsp;|&nbsp; Floors: Att 3+ · Def 5+ · Mor 2+
          </p>
        </section>

        {/* ── Abilities ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Abilities</h3>
            <span className={cn(
              'text-xs font-medium',
              usedAbilities >= maxAbilities ? 'text-primary' : 'text-muted-foreground'
            )}>
              {usedAbilities} / {maxAbilities} extra
            </span>
          </div>

          {/* Inherent abilities — always on */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs h-5 px-1.5 opacity-60">Chivalry (inherent)</Badge>
            <Badge variant="outline" className="text-xs h-5 px-1.5 opacity-60">Commander (inherent)</Badge>
          </div>

          {/* Live by the Sword — optional */}
          <Tooltip>
            <TooltipTrigger
              onClick={() => upd({ hasLiveByTheSword: !w.hasLiveByTheSword })}
              className={cn(
                'text-left px-3 py-2 rounded-md border text-sm transition-all w-full',
                w.hasLiveByTheSword
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              )}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">Live by the Sword</span>
                <span className="text-muted-foreground shrink-0">+1pt</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Optional inherent ability</p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs" side="left">
              Re-roll 1 Melee Attack dice vs non-Knights.
            </TooltipContent>
          </Tooltip>

          {/* Extra purchasable abilities */}
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {KC_ABILITIES.map(ability => {
              const isSelected = w.extraAbilities.includes(ability.id)
              const isDisabled = !isSelected && usedAbilities >= maxAbilities
              return (
                <Tooltip key={ability.id}>
                  <TooltipTrigger
                    onClick={() => !isDisabled && toggleAbility(ability.id)}
                    className={cn(
                      'text-left px-3 py-2 rounded-md border text-sm transition-all w-full',
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : isDisabled
                          ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                          : 'border-border hover:border-primary/50 text-foreground'
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{ability.name}</span>
                      <span className="text-muted-foreground shrink-0">+{ability.cost}pts</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs" side="right">
                    {ability.description}
                    {ability.restrictions.length > 0 && (
                      <p className="mt-1 text-yellow-400">⚠ {ability.restrictions.join(', ')}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </section>

        {/* ── Equipment ── */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipment (per warrior)</h3>

          {/* Melee Weapon */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Melee Weapon <span className="text-destructive">*</span></p>
            <div className="grid grid-cols-2 gap-1">
              {(w.isMounted ? MOUNTED_MELEE : DISMOUNTED_MELEE).map(wId => {
                const wData = weaponById[wId]
                if (!wData) return null
                return (
                  <button
                    key={wId}
                    onClick={() => upd({ meleeWeapon: wId })}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                      w.meleeWeapon === wId
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    <span className="font-medium">{wData.name}</span>
                    <span className="ml-1 text-muted-foreground">+{wData.cost}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lance (mounted only, doesn't replace) */}
          {w.isMounted && (
            <button
              onClick={() => !isTWH && upd({ hasLance: !w.hasLance })}
              disabled={isTWH}
              className={cn(
                'w-full rounded-md border px-3 py-1.5 text-sm text-left transition-all',
                w.hasLance
                  ? 'border-primary bg-primary/10 text-foreground'
                  : isTWH
                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
              )}
            >
              <span className="font-medium">Lance</span>
              <span className="text-muted-foreground text-xs ml-2">+4pts · doesn't replace weapon · single charge use</span>
            </button>
          )}

          {/* Armour — Mail is mandatory */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Armour</p>
            <div className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm">
              <span className="font-medium">Mail</span>
              <span className="text-muted-foreground text-xs ml-2">+2pts · Move -2"</span>
              <span className="text-xs text-muted-foreground ml-2 opacity-60">(required)</span>
            </div>
          </div>

          {/* Shield */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Shield{isTWH && <span className="ml-1 text-yellow-500">(blocked by TWH)</span>}</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => !isTWH && upd({ shield: null })}
                disabled={isTWH}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                  w.shield === null && !isTWH
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >None</button>
              {SHIELD_OPTIONS.map(sId => {
                const sData = shieldById[sId]
                if (!sData) return null
                return (
                  <button
                    key={sId}
                    onClick={() => !isTWH && upd({ shield: sId })}
                    disabled={isTWH}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                      w.shield === sId
                        ? 'border-primary bg-primary/10 text-foreground'
                        : isTWH
                          ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <span className="font-medium">{sData.name}</span>
                    <span className="ml-1">+{sData.cost}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mount (mounted only) */}
          {w.isMounted && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Mount <span className="text-destructive">*</span></p>
              <div className="grid grid-cols-2 gap-1">
                {MOUNT_OPTIONS.map(mId => {
                  const mData = mountById[mId]
                  if (!mData) return null
                  return (
                    <button
                      key={mId}
                      onClick={() => upd({ mount: mId })}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                        w.mount === mId
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 text-muted-foreground'
                      )}
                    >
                      <span className="font-medium">{mData.name}</span>
                      <span className="ml-1">+{mData.cost}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Command Group Upgrades ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Command Group Upgrades</h3>
          <div className="grid grid-cols-2 gap-1">
            {/* Banner for Baron only, Pennant for Lord only */}
            {w.baseType === 'baron' ? (
              <button
                onClick={() => upd({ cgBanner: !w.cgBanner })}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                  w.cgBanner
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                <span className="font-medium">Banner</span>
                <span className="ml-1 text-muted-foreground">+9pts</span>
              </button>
            ) : (
              <button
                onClick={() => upd({ cgPennant: !w.cgPennant })}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                  w.cgPennant
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                <span className="font-medium">Pennant</span>
                <span className="ml-1 text-muted-foreground">+7pts</span>
              </button>
            )}
            <button
              onClick={() => upd({ cgMusician: !w.cgMusician })}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                w.cgMusician
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              )}
            >
              <span className="font-medium">Musician</span>
              <span className="ml-1 text-muted-foreground">+4pts</span>
            </button>
            <button
              onClick={() => upd({ cgPriest: !w.cgPriest })}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                w.cgPriest
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              )}
            >
              <span className="font-medium">Priest</span>
              <span className="ml-1 text-muted-foreground">+4pts</span>
            </button>
          </div>
        </section>

      </div>

      {/* Footer — cost summary + add button */}
      <div className="border-t border-border p-4 shrink-0 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">
            {w.baseType === 'baron' ? '♛♛♛ Baron' : '♛♛ Lord'}
            {w.isMounted ? ' (Mounted)' : ''}
          </span>
          <span className="text-xl font-bold text-primary">{totalCost} pts</span>
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToRetinue}
        >
          Add to Retinue
        </Button>
      </div>
    </div>
  )
}
