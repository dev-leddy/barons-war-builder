'use client'

import { useState } from 'react'
import type { Group, Experience, GroupEquipment } from '@/src/types'
import { computeGroupCost, computeEquipmentCost } from '@/src/logic/costs'
import { unitTypeById, CONDITIONAL_INHERENT } from '@/src/data/unitTypes'
import { weaponById, armourById, shieldById, mountById } from '@/src/data/equipment'
import { abilityById } from '@/src/data/abilities'
import {
  getAvailableMeleeWeapons,
  getAvailableRangedWeapons,
  getAvailableArmour,
  getAvailableShields,
  getAvailableMounts,
  defaultEquipment,
} from '@/src/logic/equipment'
import { getAvailableAbilities } from '@/src/logic/abilities'
import { useRetinueStore } from '@/src/store/retinueStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { CommandGroupLinker } from './CommandGroupLinker'
import { Star, Crown, Copy, Trash2, ChevronDown, ChevronUp, Shield, Sword, Crosshair, Users, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationError } from '@/src/types'

const ROLE_BORDER: Record<string, string> = {
  commander: 'border-l-[var(--chart-1)]',
  cavalry:   'border-l-[var(--chart-2)]',
  infantry:  'border-l-[var(--chart-3)]',
  ranged:    'border-l-[var(--chart-4)]',
  support:   'border-l-[var(--chart-5)]',
}

const ROLE_IMG_BG: Record<string, string> = {
  commander: 'bg-amber-100 text-amber-800 border-amber-400/60',
  cavalry:   'bg-red-100 text-red-800 border-red-400/60',
  infantry:  'bg-blue-100 text-blue-800 border-blue-400/60',
  ranged:    'bg-green-100 text-green-800 border-green-400/60',
  support:   'bg-stone-100 text-stone-600 border-stone-400/60',
}

const TIER_CROWNS: Record<number, string> = { 3: '♛♛♛', 2: '♛♛', 1: '♛' }

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

const EXP_LABELS: Record<string, string> = {
  green: 'Green', irregular: 'Irregular', regular: 'Regular', veteran: 'Veteran',
}

const EXP_ORDER = ['green', 'irregular', 'regular', 'veteran']

function getEffectiveInherent(unitTypeId: string, abilityIds: string[], experience: string): string[] {
  const conditionals = CONDITIONAL_INHERENT[unitTypeId] ?? {}
  return abilityIds.filter(id => {
    const minExp = conditionals[id]
    if (!minExp) return true
    return EXP_ORDER.indexOf(experience) >= EXP_ORDER.indexOf(minExp)
  })
}

const CG_UPGRADE_COSTS = { banner: 9, pennant: 7, musician: 4, priest: 4 } as const

const CG_UPGRADE_TOOLTIPS: Record<string, string> = {
  banner:   '12" Command range\nINSPIRE: friendly groups within 12" gain a free Attack or Defence die',
  pennant:  '9" Command range\nINSPIRE: friendly groups within 9" gain a free Attack or Defence die',
  musician: 'Friendly groups within Command range roll 2d10 for Order checks',
  priest:   'Friendly groups within 6" may ignore 1 Morale Penalty on Morale checks',
}

function buildWeaponTooltip(id: string): string {
  const w = weaponById[id]
  if (!w) return ''
  const parts: string[] = []
  if (w.attackBonus > 0) parts.push(`+${w.attackBonus} Attack`)
  if (w.isRanged) {
    const ranges = [w.rangeShort && `${w.rangeShort}" short`].filter(Boolean)
    if ((w as any).rangeLong) ranges.unshift(`${(w as any).rangeLong}" long`)
    if (ranges.length) parts.push(ranges.join(' / '))
  }
  w.specialRules.forEach(r => parts.push(r))
  return parts.join('\n')
}

function buildArmourTooltip(id: string): string {
  const a = armourById[id]
  if (!a) return ''
  const parts = [`+${a.defenceBonus} Defence`, `${a.moveModifier}" Move`]
  a.specialRules.forEach(r => parts.push(r))
  return parts.join('\n')
}

function buildShieldTooltip(id: string): string {
  const s = shieldById[id]
  if (!s) return ''
  return `Shield roll ${s.shieldRoll}`
}

function buildMountTooltip(id: string): string {
  const m = mountById[id]
  if (!m) return ''
  const parts = [`+${m.moveBonus}" Move`]
  if (m.defenceBonus > 0) parts.push(`+${m.defenceBonus} Defence`)
  return parts.join('\n')
}

// Weapon notes to exclude from display (obvious/handled elsewhere)
// Rules to hide from the card-face weapon notes (shown in tooltip instead)
const SKIP_RULE_PREFIXES = ['TWO HANDED', 'SLOW', 'MOUNTED only']

function buildWeaponNotes(weaponId: string | null | undefined, label?: string): string | null {
  if (!weaponId || weaponId === 'none') return null
  const w = weaponById[weaponId]
  if (!w || w.id === 'hand_weapon') return null
  const parts: string[] = []
  if (w.attackBonus > 0) parts.push(`+${w.attackBonus} to Attack rolls`)
  w.specialRules.filter(r => !SKIP_RULE_PREFIXES.some(p => r.startsWith(p))).forEach(r => parts.push(r))
  if (parts.length === 0) return null
  return `${label ?? w.name}: ${parts.join('\n')}`
}

interface Props {
  group: Group
  validationErrors: ValidationError[]
  /** True when rendered as the warrior sub-card inside a commander cluster */
  nested?: boolean
  /** True when rendered inside a CommanderCluster — suppresses outer border/rounding */
  embedded?: boolean
  /** Narrower left panel for side-by-side cluster layout */
  compact?: boolean
  /** Don't render CommandGroupLinker inline (cluster handles it externally) */
  hideLinker?: boolean
  /** The warrior group currently linked to this commander (passed for display, not used directly — CommandGroupLinker reads from store) */
  linkedWarriorGroup?: Group | null
  /** Stretch to fill the parent flex container (for uniform grid card heights) */
  fillHeight?: boolean
}

export function GroupCard({ group, validationErrors, nested = false, embedded = false, compact = false, hideLinker = false, fillHeight = false }: Props) {
  const unitType = unitTypeById[group.unitTypeId]
  const updateGroup = useRetinueStore(s => s.updateGroup)
  const removeGroup = useRetinueStore(s => s.removeGroup)
  const duplicateGroup = useRetinueStore(s => s.duplicateGroup)
  const setRetinueLeader = useRetinueStore(s => s.setRetinueLeader)
  const unlinkGroup = useRetinueStore(s => s.unlinkGroup)
  const [abilitiesOpen, setAbilitiesOpen] = useState(false)

  if (!unitType) return null

  const cost = computeGroupCost(group)
  const isCommander = unitType.isCommander
  const commander = group.commander
  const isRetinueLeader = commander?.isRetinueLeader ?? false
  const isKC = commander?.isKnightCommander ?? false
  const groupErrors = validationErrors.filter(e => e.groupId === group.id)
  const hasErrors = groupErrors.some(e => e.severity === 'error')
  const hasWarnings = groupErrors.some(e => e.severity === 'warning')

  const equipment = isCommander && commander ? commander.equipment : group.equipment
  const minSize = unitType.minGroupSize ?? (unitType.isMounted ? 2 : 4)

  // Effective stats
  const baseStats = unitType.stats[group.experience]
  const armourData = equipment.armour ? armourById[equipment.armour] : null
  const shieldData = equipment.shield ? shieldById[equipment.shield] : null
  const mountData = equipment.mount ? mountById[equipment.mount] : null

  const parseTarget = (s: string) => parseInt(s.replace('+', ''), 10)
  const effectiveMove = baseStats
    ? `${baseStats.move + (armourData?.moveModifier ?? 0) + (mountData?.moveBonus ?? 0)}"`
    : null
  const effectiveAttack = baseStats?.attack ?? null
  // Defence improves (number decreases) with armour and barded horse
  const effectiveDefence = baseStats
    ? `${parseTarget(baseStats.defence) - (armourData?.defenceBonus ?? 0) - (mountData?.defenceBonus ?? 0)}+`
    : null
  const shieldRoll = shieldData ? shieldData.shieldRoll : '—'
  const effectiveMorale = baseStats?.morale ?? null
  const effectiveActions = baseStats?.actions ?? null

  // Weapon bonus notes
  const weaponNotes: string[] = []
  const meleeNote = buildWeaponNotes(equipment.meleeWeapon)
  if (meleeNote) weaponNotes.push(meleeNote)
  const rangedNote = buildWeaponNotes(equipment.rangedWeapon)
  if (rangedNote) weaponNotes.push(rangedNote)

  // Experience change: update both group and commander (for commanders)
  const handleExpChange = (exp: Experience) => {
    if (isCommander && commander) {
      const newEquip = defaultEquipment(unitType, exp)
      updateGroup(group.id, {
        experience: exp,
        commander: { ...commander, experience: exp, equipment: newEquip },
      })
    } else {
      updateGroup(group.id, {
        experience: exp,
        equipment: defaultEquipment(unitType, exp),
      })
    }
  }

  // Equipment change
  const handleEquipChange = (newEquip: GroupEquipment) => {
    if (isCommander && commander) {
      updateGroup(group.id, { commander: { ...commander, equipment: newEquip } })
    } else {
      updateGroup(group.id, { equipment: newEquip })
    }
  }

  // CG upgrade toggle
  const handleCGToggle = (key: keyof typeof group.commandGroupUpgrade) => {
    updateGroup(group.id, {
      commandGroupUpgrade: {
        ...group.commandGroupUpgrade,
        [key]: !group.commandGroupUpgrade[key],
      },
    })
  }

  // Abilities
  const selectedAbilities = isCommander
    ? (commander?.purchasedAbilities ?? [])
    : group.purchasedAbilities

  const hasArmour = !!(equipment.armour)
  const hasBowOrCrossbow =
    equipment.rangedWeapon === 'bow' || equipment.rangedWeapon === 'crossbow'

  const availableAbilities = getAvailableAbilities({
    unitType,
    experience: group.experience,
    isRetinueLeader,
    isMounted: unitType.isMounted,
    hasArmour,
    hasBowOrCrossbow,
    unitTypeId: unitType.id,
  })

  const handleAbilityToggle = (abilId: string) => {
    const next = selectedAbilities.includes(abilId)
      ? selectedAbilities.filter(a => a !== abilId)
      : [...selectedAbilities, abilId]
    if (isCommander && commander) {
      updateGroup(group.id, { commander: { ...commander, purchasedAbilities: next } })
    } else {
      updateGroup(group.id, { purchasedAbilities: next })
    }
  }

  // Equipment options
  const meleeOptions = getAvailableMeleeWeapons(unitType, group.experience)
  const rangedOptions = getAvailableRangedWeapons(unitType)
  const armourOptions = getAvailableArmour(unitType, group.experience)
  const shieldOptions = getAvailableShields(unitType, equipment.meleeWeapon, equipment.rangedWeapon)
  const mountOptions = getAvailableMounts(unitType)

  // Inherent abilities display — filter out experience-gated ones not yet unlocked
  const baseInherent = isKC ? ['chivalry', 'commander_ability'] : unitType.inherentAbilities
  const inherent = isKC
    ? baseInherent
    : getEffectiveInherent(unitType.id, baseInherent, group.experience)

  const imgStyle = ROLE_IMG_BG[unitType.role] ?? ROLE_IMG_BG.infantry
  const RoleIcon = { cavalry: Sword, infantry: Shield, ranged: Crosshair, support: Users, commander: Crown }[unitType.role] ?? Shield

  return (
    <div className={cn(
      'bg-card border-l-4 flex flex-col',
      !embedded && 'border border-border rounded-lg',
      nested && 'bg-muted/60',
      fillHeight && 'h-full',
      ROLE_BORDER[unitType.role] ?? 'border-l-border',
      hasErrors && !embedded && 'ring-1 ring-destructive/50',
      hasWarnings && !hasErrors && !embedded && 'ring-1 ring-yellow-500/30',
    )}>

      {/* ── Two-panel row: identity left, stats+equip right ── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT PANEL: image · name · cost · exp · count / commander input */}
        <div className={cn(
          compact ? 'w-36' : 'w-52',
          'shrink-0 p-3 border-r border-border/40 flex flex-col gap-2.5',
        )}>

          {/* Image + name + cost */}
          <div className="flex items-start gap-2.5">
            <div className={cn(
              'rounded-full shrink-0 overflow-hidden border-2',
              nested || compact ? 'w-11 h-11' : 'w-14 h-14',
              imgStyle,
            )}>
              {UNIT_IMAGES[unitType.id] ? (
                <img src={UNIT_IMAGES[unitType.id]} alt={unitType.name} className="w-full h-full object-contain scale-90" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isCommander
                    ? <span className="text-xs font-bold leading-none">{TIER_CROWNS[unitType.tier]}</span>
                    : <RoleIcon className="h-5 w-5" />}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap mb-0.5">
                {isRetinueLeader && (
                  <Tooltip>
                    <TooltipTrigger className="cursor-default inline-flex">
                      <Star className="h-3.5 w-3.5 fill-[var(--chart-1)] text-[var(--chart-1)] shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Retinue Leader</TooltipContent>
                  </Tooltip>
                )}
                <span className="font-heading font-semibold text-base leading-tight">
                  {isCommander && commander?.name ? commander.name : unitType.name}
                </span>
              </div>
              {isCommander && commander?.name && (
                <p className="text-muted-foreground text-xs leading-tight truncate">— {unitType.name}</p>
              )}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-primary tabular-nums leading-none">{cost}</span>
                <span className="text-[10px] text-muted-foreground leading-none">pts</span>
              </div>
            </div>
          </div>

          {/* Experience pills */}
          <div className="flex gap-1 flex-wrap">
            {unitType.experienceOptions.map(exp => (
              <button
                key={exp}
                onClick={() => handleExpChange(exp as Experience)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  group.experience === exp
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                )}
              >
                {EXP_LABELS[exp] ?? exp}
              </button>
            ))}
          </div>

          {/* Warrior count stepper + per-warrior cost */}
          {!isCommander && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => updateGroup(group.id, { count: Math.max(minSize, group.count - 1) })}
                disabled={group.count <= minSize}
                className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-accent transition-colors shrink-0"
                aria-label="Remove one warrior"
              >−</button>
              <span className="w-7 text-center text-sm font-semibold tabular-nums">{group.count}</span>
              <button
                onClick={() => updateGroup(group.id, { count: group.count + 1 })}
                className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors shrink-0"
                aria-label="Add one warrior"
              >+</button>
              <span className="text-xs text-muted-foreground leading-tight">
                {unitType.baseCosts[group.experience] ?? 0}
                {computeEquipmentCost(group.equipment) > 0 && <span>+{computeEquipmentCost(group.equipment)}</span>}
                {' ea'}
              </span>
            </div>
          )}

          {/* Commander name input */}
          {isCommander && commander && !isKC && !commander.isDramatisPersonae && (
            <Input
              value={commander.name}
              onChange={e => updateGroup(group.id, { commander: { ...commander, name: e.target.value } })}
              placeholder="Name (optional)"
              className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:border-primary px-1"
            />
          )}
        </div>

        {/* RIGHT PANEL: stats bar + equipment rows */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Stats bar */}
          {effectiveMove && (
            <div className="border-b border-border/40 bg-secondary/20">
              <div className="grid grid-cols-6 divide-x divide-border/30">
                {[
                  { label: 'MV',   value: effectiveMove    },
                  { label: 'ATT',  value: effectiveAttack  },
                  { label: 'DEF',  value: effectiveDefence },
                  { label: 'SHD',  value: shieldRoll       },
                  { label: 'MOR',  value: effectiveMorale  },
                  { label: 'ACT',  value: effectiveActions },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center justify-center py-2 gap-0.5">
                    <span className="text-[8px] uppercase tracking-wider text-foreground/60 leading-none font-medium">{label}</span>
                    <span className="text-sm font-bold text-primary leading-tight tabular-nums">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
              {weaponNotes.length > 0 && (
                <div className="px-3 py-1 border-t border-border/30">
                  {weaponNotes.flatMap((note, i) =>
                    note.split('\n').map((line, j) => (
                      <p key={`${i}-${j}`} className="text-[9px] text-foreground/60 italic">{line}</p>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Equipment rows */}
          <div className="px-4 py-2 flex-1">

            {meleeOptions.length > 0 && (
              <EquipRow
                label="Melee"
                options={meleeOptions.map(id => ({
                  id,
                  label: weaponById[id]?.name ?? id,
                  cost: weaponById[id]?.cost ?? 0,
                  tooltip: buildWeaponTooltip(id),
                }))}
                selected={equipment.meleeWeapon}
                onSelect={id => {
                  const newShields = getAvailableShields(unitType, id as any, equipment.rangedWeapon)
                  handleEquipChange({
                    ...equipment,
                    meleeWeapon: id as any,
                    shield: newShields.length === 0 ? null : equipment.shield,
                  })
                }}
              />
            )}

            {rangedOptions.length > 0 && (
              <EquipRow
                label="Ranged"
                options={rangedOptions.map(id => ({
                  id,
                  label: weaponById[id]?.name ?? id,
                  cost: weaponById[id]?.cost ?? 0,
                  tooltip: buildWeaponTooltip(id),
                }))}
                selected={equipment.rangedWeapon}
                onSelect={id => handleEquipChange({ ...equipment, rangedWeapon: id as any })}
              />
            )}

            {armourOptions.length > 0 && (
              <EquipRow
                label="Armour"
                options={[
                  ...(!unitType.armour.required ? [{ id: 'none', label: 'None', cost: 0 }] : []),
                  ...armourOptions.map(id => ({
                    id,
                    label: armourById[id]?.name ?? id,
                    cost: armourById[id]?.cost ?? 0,
                    tooltip: buildArmourTooltip(id),
                  })),
                ]}
                selected={equipment.armour ?? 'none'}
                onSelect={id => handleEquipChange({ ...equipment, armour: id === 'none' ? null : id as any })}
              />
            )}

            {unitType.shield.options.length > 0 && (
              shieldOptions.length > 0 ? (
                <EquipRow
                  label="Shield"
                  options={[
                    { id: 'none', label: 'None', cost: 0 },
                    ...shieldOptions.map(id => ({
                      id,
                      label: shieldById[id]?.name ?? id,
                      cost: shieldById[id]?.cost ?? 0,
                      tooltip: buildShieldTooltip(id),
                    })),
                  ]}
                  selected={equipment.shield ?? 'none'}
                  onSelect={id => handleEquipChange({ ...equipment, shield: id === 'none' ? null : id as any })}
                />
              ) : (
                <div className="flex items-start gap-3 py-1.5 border-t border-border/20">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 w-14 shrink-0 pt-1.5 text-right leading-tight">Shield</span>
                  <p className="text-xs text-muted-foreground/40 italic pt-1">N/A (two-handed weapon)</p>
                </div>
              )
            )}

            {mountOptions.length > 0 && (
              <EquipRow
                label="Mount"
                options={mountOptions.map(id => ({
                  id,
                  label: mountById[id]?.name ?? id,
                  cost: mountById[id]?.cost ?? 0,
                  tooltip: buildMountTooltip(id),
                }))}
                selected={equipment.mount}
                onSelect={id => handleEquipChange({ ...equipment, mount: id as any })}
              />
            )}

            {/* Lance add-on */}
            {unitType.isMounted && equipment.mount && (
              <EquipRow
                label="Lance"
                options={[
                  { id: 'no_lance', label: 'None', cost: 0 },
                  { id: 'lance', label: 'Lance', cost: 4, tooltip: buildWeaponTooltip('lance') },
                ]}
                selected={equipment.meleeWeapon === 'lance' ? 'lance' : 'no_lance'}
                onSelect={id => handleEquipChange({
                  ...equipment,
                  meleeWeapon: id === 'lance' ? 'lance' as any : 'sword' as any,
                })}
              />
            )}

            {/* CG upgrades */}
            {isCommander && unitType.commandGroupUpgrades.length > 0 && (
              <EquipRow
                label="Command"
                options={unitType.commandGroupUpgrades.map(key => ({
                  id: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  cost: CG_UPGRADE_COSTS[key as keyof typeof CG_UPGRADE_COSTS] ?? 0,
                  tooltip: CG_UPGRADE_TOOLTIPS[key],
                }))}
                selected={
                  Object.entries(group.commandGroupUpgrade)
                    .filter(([, v]) => v)
                    .map(([k]) => k)[0] ?? null
                }
                multiSelected={Object.entries(group.commandGroupUpgrade)
                  .filter(([, v]) => v)
                  .map(([k]) => k)}
                onSelect={id => handleCGToggle(id as any)}
                multiSelect
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Command Group linker (commanders only, full width) ── */}
      {isCommander && !nested && !hideLinker && (
        <CommandGroupLinker commanderGroup={group} />
      )}

      {/* ── Validation errors ── */}
      {groupErrors.length > 0 && (
        <div className="px-3 py-2 border-t border-border/40 space-y-0.5">
          {groupErrors.map((e, i) => (
            <p
              key={i}
              className={cn('text-xs', e.severity === 'error' ? 'text-destructive' : 'text-yellow-500')}
            >
              {e.severity === 'error' ? '✕' : '⚠'} {e.message}
            </p>
          ))}
        </div>
      )}

      {/* ── Abilities (expandable) ── */}
      {(availableAbilities.length > 0 || inherent.length > 0) && (
        <div className="border-t border-border/50">
          {/* Abilities header — always visible */}
          <button
            onClick={() => setAbilitiesOpen(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-medium text-foreground/80 shrink-0">Abilities</span>

            {/* Inherent ability pills — always shown */}
            <div className="flex flex-wrap gap-1 flex-1">
              {inherent.map(id => {
                const ab = abilityById[id]
                if (!ab?.description) {
                  return (
                    <span key={id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/60">
                      {ab?.name ?? id.replace(/_/g, ' ')}
                    </span>
                  )
                }
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger render={<span />} className="cursor-default px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/60">
                      {ab.name}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs whitespace-pre-line" side="top">{ab.description}</TooltipContent>
                  </Tooltip>
                )
              })}
              {/* Selected purchased ability pills — shown when collapsed */}
              {!abilitiesOpen && selectedAbilities.map(id => {
                const ab = abilityById[id]
                if (!ab?.description) {
                  return (
                    <span key={id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/40">
                      {ab?.name ?? id.replace(/_/g, ' ')}
                    </span>
                  )
                }
                return (
                  <Tooltip key={id}>
                    <TooltipTrigger render={<span />} className="cursor-default px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/40">
                      {ab.name}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs whitespace-pre-line" side="top">{ab.description}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            {abilitiesOpen
              ? <ChevronUp className="h-3.5 w-3.5 shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            }
          </button>

          {/* Ability checkbox grid — shown when expanded */}
          {abilitiesOpen && availableAbilities.length > 0 && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/30 pt-3">
              {availableAbilities.map(ab => {
                const isSelected = selectedAbilities.includes(ab.id)
                return (
                  <Tooltip key={ab.id}>
                    <TooltipTrigger
                      onClick={() => handleAbilityToggle(ab.id)}
                      className="flex items-center gap-2 text-left group w-full"
                    >
                      {/* Checkbox */}
                      <span className={cn(
                        'w-3.5 h-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-border/70 group-hover:border-primary/60'
                      )}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className={cn(
                        'text-xs leading-tight transition-colors',
                        isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}>
                        {ab.name}
                        <span className="text-muted-foreground/60 ml-1">(+{ab.cost} pts)</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs" side="top">
                      {ab.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex items-center gap-1 px-3 pb-3 pt-1 border-t border-border/50">
        {nested ? (
          <>
            <button
              onClick={() => unlinkGroup(group.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Link2Off className="h-3.5 w-3.5" /> Detach
            </button>
            <div className="flex-1" />
            <button
              onClick={() => removeGroup(group.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => duplicateGroup(group.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            {isCommander && !isRetinueLeader && (
              <button
                onClick={() => setRetinueLeader(group.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Crown className="h-3.5 w-3.5" /> Set Leader
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={() => removeGroup(group.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Inline equipment chip row ──────────────────────────────────────────────────

interface EquipRowProps {
  label: string
  options: { id: string; label: string; cost: number; tooltip?: string }[]
  selected: string | null | undefined
  multiSelected?: string[]
  onSelect: (id: string) => void
  multiSelect?: boolean
}

function EquipRow({ label, options, selected, multiSelected, onSelect, multiSelect }: EquipRowProps) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-t border-border/20 first:border-t-0">
      <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/40 w-14 shrink-0 pt-1.5 text-right leading-tight">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {options.map(opt => {
          const isActive = multiSelect
            ? (multiSelected ?? []).includes(opt.id)
            : (selected === opt.id || (opt.id === 'none' && !selected))

          const chipClass = cn(
            'px-2.5 py-0.5 rounded text-xs font-medium transition-colors border leading-5',
            isActive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary/50 text-muted-foreground border-border/40 hover:border-primary/50 hover:text-foreground'
          )

          const chipContent = (
            <>
              {opt.label}
              {opt.cost > 0 && (
                <span className="ml-1 opacity-60 tabular-nums">+{opt.cost}</span>
              )}
            </>
          )

          if (!opt.tooltip) {
            return (
              <button key={opt.id} onClick={() => onSelect(opt.id)} className={chipClass}>
                {chipContent}
              </button>
            )
          }
          return (
            <Tooltip key={opt.id}>
              <TooltipTrigger onClick={() => onSelect(opt.id)} className={chipClass}>
                {chipContent}
              </TooltipTrigger>
              <TooltipContent className="block p-0 max-w-xs overflow-hidden" side="top">
                <div className="flex items-baseline justify-between gap-4 px-3 pt-2 pb-1.5 border-b border-white/10">
                  <span className="font-semibold text-sm">{opt.label}</span>
                  {opt.cost > 0 && <span className="text-xs opacity-60 tabular-nums shrink-0">{opt.cost} pts</span>}
                </div>
                <div className="px-3 pt-1.5 pb-2 space-y-0.5">
                  {opt.tooltip.split('\n').map((line, i) => (
                    <p key={i} className="text-xs opacity-80">{line}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
