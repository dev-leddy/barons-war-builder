// ─── Experience & Tier ───────────────────────────────────────────────────────

export type Experience = 'green' | 'irregular' | 'regular' | 'veteran'
export type Tier = 1 | 2 | 3

// ─── Equipment IDs ───────────────────────────────────────────────────────────

export type MeleeWeaponId =
  | 'hand_weapon'
  | 'battle_axe'
  | 'improvised_two_handed_weapon'
  | 'spear'
  | 'falchion'
  | 'sword'
  | 'mace'
  | 'bill'
  | 'horsemans_pick'
  | 'two_handed_weapon'
  | 'lance'

export type RangedWeaponId = 'sling' | 'javelin' | 'bow' | 'crossbow'

export type WeaponId = MeleeWeaponId | RangedWeaponId

export type ArmourId = 'padded' | 'mail'

export type ShieldId = 'small_shield' | 'medium_shield' | 'large_shield'

export type MountId = 'horse' | 'barded_horse'

// ─── Equipment per warrior ───────────────────────────────────────────────────

export interface GroupEquipment {
  meleeWeapon: MeleeWeaponId
  rangedWeapon: RangedWeaponId | null
  armour: ArmourId | null
  shield: ShieldId | null
  mount: MountId | null
}

// ─── Command Group Upgrades ───────────────────────────────────────────────────

export interface CommandGroupUpgrade {
  banner: boolean
  pennant: boolean
  musician: boolean
  priest: boolean
}

// ─── Commander ───────────────────────────────────────────────────────────────

export interface Commander {
  id: string
  name: string
  unitTypeId: string
  experience: Experience
  equipment: GroupEquipment
  purchasedAbilities: string[]
  isRetinueLeader: boolean
  isKnightCommander: boolean
  knightCommanderData: KnightCommanderData | null
  isDramatisPersonae: boolean
  dramatisPersonaeId: string | null
}

// ─── Knight Commander Generator ──────────────────────────────────────────────

export interface KnightCommanderData {
  baseType: 'baron' | 'lord'
  statUpgrades: {
    attack: number   // number of upgrades, each +2pts
    defence: number  // number of upgrades, each +2pts
    morale: number   // number of upgrades, each +1pt
  }
  extraAbilities: string[]
}

// ─── Group ───────────────────────────────────────────────────────────────────

export interface Group {
  id: string
  unitTypeId: string
  experience: Experience
  count: number
  isCommandGroup: boolean
  commandGroupUpgrade: CommandGroupUpgrade
  equipment: GroupEquipment
  purchasedAbilities: string[]
  commander: Commander | null
  /** Warrior groups only — points to the commander Group.id this warrior group serves */
  commanderGroupId: string | null
}

// ─── Retinue ─────────────────────────────────────────────────────────────────

import type { FactionId } from '@/src/data/factions'

export interface Retinue {
  id: string
  name: string
  faction: FactionId
  pointsLimit: number
  retinueLeaderGroupId: string | null
  groups: Group[]
  createdAt: string
  updatedAt: string
}

// ─── Unit Type (static data) ──────────────────────────────────────────────────

export interface WeaponOptions {
  required: boolean
  options: MeleeWeaponId[]
}

export interface RangedWeaponOptions {
  required: boolean
  options: RangedWeaponId[]
}

export interface ArmourOptions {
  required: boolean
  options: ArmourId[]
  /** Min experience required to use mail, if restricted */
  mailMinExperience?: Experience
}

export interface ShieldOptions {
  required: boolean
  options: ShieldId[]
  /** Weapon IDs that prevent shield use (TWO HANDED weapons) */
  excludeIfWeapon: WeaponId[]
}

export interface MountOptions {
  required: boolean
  options: MountId[]
}

export interface Stats {
  move: number     // inches
  attack: string   // e.g. "5+"
  defence: string  // e.g. "7+"
  morale: string   // e.g. "3+"
  actions: number
}

export interface UnitType {
  id: string
  name: string
  tier: Tier
  isMounted: boolean
  isCommander: boolean
  experienceOptions: Experience[]
  baseCosts: Partial<Record<Experience, number>>
  stats: Partial<Record<Experience, Stats>>
  inherentAbilities: string[]
  meleeWeapons: WeaponOptions
  rangedWeapons: RangedWeaponOptions
  armour: ArmourOptions
  shield: ShieldOptions
  mount: MountOptions
  /** Which CG upgrades this unit type can have */
  commandGroupUpgrades: Array<'banner' | 'pennant' | 'musician' | 'priest'>
  /** Which unit types can form this commander's command group */
  commandGroupFrom: string[]
  /** null means not a warrior group (commander only); otherwise the min */
  minGroupSize: number | null
  /** Roles for filtering in UI */
  role: 'commander' | 'cavalry' | 'infantry' | 'ranged' | 'support'
}

// ─── Equipment (static data) ──────────────────────────────────────────────────

export interface WeaponData {
  id: WeaponId
  name: string
  cost: number
  attackBonus: number
  isTwoHanded: boolean
  isMountedOnly: boolean
  isRanged: boolean
  rangeShort?: number
  rangeLong?: number
  specialRules: string[]
}

export interface ArmourData {
  id: ArmourId
  name: string
  cost: number
  defenceBonus: number
  moveModifier: number
  specialRules: string[]
}

export interface ShieldData {
  id: ShieldId
  name: string
  cost: number
  shieldRoll: string
}

export interface MountData {
  id: MountId
  name: string
  cost: number
  moveBonus: number
  defenceBonus: number
}

// ─── Ability (static data) ────────────────────────────────────────────────────

export interface Ability {
  id: string
  name: string
  cost: number
  description: string
  /** Restrictions as a list of constraint keys */
  restrictions: AbilityRestriction[]
  isInherent: boolean
  inherentCost?: number
}

export type AbilityRestriction =
  | 'commander_only'
  | 'retinue_leader_only'
  | 'mounted_knights_only'
  | 'horse_or_barded_only'
  | 'unarmoured_only'
  | 'bow_or_crossbow_only'

// ─── Dramatis Personae (static data) ─────────────────────────────────────────

export interface DramatisPersonaeProfile {
  id: string
  name: string
  title: string
  lore: string
  unitTypeId: string  // base type (e.g. "baron_mounted")
  experience: Experience
  stats: Stats
  equipment: GroupEquipment
  inherentAbilities: string[]
  purchasedAbilities: string[]
  commandGroupFrom: string[]
  commandGroupUpgrades: Array<'banner' | 'pennant' | 'musician' | 'priest'>
  pointsCost: number
  /** Equipment items the player may optionally swap */
  equipmentOptions?: Partial<{
    meleeWeapons: MeleeWeaponId[]
    rangedWeapons: RangedWeaponId[]
    armour: ArmourId[]
    shields: ShieldId[]
    mounts: MountId[]
  }>
  specialRules?: string[]
}

// ─── Faction Trait (static data) ─────────────────────────────────────────────

export interface FactionTrait {
  id: string
  name: string
  description: string
}

// ─── Saves ────────────────────────────────────────────────────────────────────

export type SaveCategory = 'Standard' | 'Campaign'

export interface SaveSlot {
  id: string
  name: string
  category: SaveCategory
  data: Retinue
  updatedAt: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationError {
  code: string
  severity: ValidationSeverity
  message: string
  groupId?: string
}
