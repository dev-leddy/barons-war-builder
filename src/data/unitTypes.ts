import type { UnitType } from '@/src/types'

// PDF pp.121–126 / printed pp.120–125 — all unit profiles
// Costs confirmed: Baron p.121, Lord p.122 (Regular=27 text-confirmed p.109),
// Serjeant at Arms p.123, Warriors pp.124–126

// TWO HANDED weapons that block shield: improvised_two_handed_weapon, bill,
// bow, crossbow, two_handed_weapon
const TWO_HANDED_WEAPONS = [
  'improvised_two_handed_weapon',
  'bill',
  'bow',
  'crossbow',
  'two_handed_weapon',
] as const

// ─── Tier 3: Barons ───────────────────────────────────────────────────────────
// PDF p.121 / printed p.120

const baron_foot: UnitType = {
  id: 'baron_foot',
  name: 'Baron',
  tier: 3,
  isMounted: false,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 36, regular: 39, veteran: 42 },
  stats: {
    irregular: { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 3 },
    regular:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 3 },
    veteran:   { move: 6, attack: '4+', defence: '7+', morale: '2+', actions: 3 },
  },
  inherentAbilities: ['chivalry', 'commander_ability', 'live_by_the_sword'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'two_handed_weapon'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: true,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: ['two_handed_weapon'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: ['banner', 'musician', 'priest'],
  commandGroupFrom: ['knights'],
  minGroupSize: null,
  role: 'commander',
}

const baron_mounted: UnitType = {
  id: 'baron_mounted',
  name: 'Baron (Mounted)',
  tier: 3,
  isMounted: true,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 38, regular: 41, veteran: 44 },
  stats: {
    irregular: { move: 9, attack: '6+', defence: '7+', morale: '4+', actions: 3 },
    regular:   { move: 9, attack: '5+', defence: '7+', morale: '3+', actions: 3 },
    veteran:   { move: 9, attack: '4+', defence: '7+', morale: '2+', actions: 3 },
  },
  inherentAbilities: ['chivalry', 'commander_ability', 'live_by_the_sword', 'ride_down'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'horsemans_pick'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: true,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: [],
  },
  mount: { required: true, options: ['horse', 'barded_horse'] },
  commandGroupUpgrades: ['banner', 'musician', 'priest'],
  commandGroupFrom: ['mounted_knights'],
  minGroupSize: null,
  role: 'commander',
}

// ─── Tier 2: Lords ────────────────────────────────────────────────────────────
// PDF p.122 / printed p.121 (Regular=27 text-confirmed PDF p.109/printed p.108)

const lord_foot: UnitType = {
  id: 'lord_foot',
  name: 'Lord',
  tier: 2,
  isMounted: false,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 24, regular: 27, veteran: 30 },
  stats: {
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 2 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 2 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 2 },
  },
  inherentAbilities: ['chivalry', 'commander_ability', 'live_by_the_sword'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'two_handed_weapon'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: true,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: ['two_handed_weapon'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: ['pennant', 'musician', 'priest'],
  commandGroupFrom: ['knights', 'serjeants'],
  minGroupSize: null,
  role: 'commander',
}

const lord_mounted: UnitType = {
  id: 'lord_mounted',
  name: 'Lord (Mounted)',
  tier: 2,
  isMounted: true,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 26, regular: 29, veteran: 32 },
  stats: {
    irregular: { move: 9, attack: '7+', defence: '7+', morale: '5+', actions: 2 },
    regular:   { move: 9, attack: '6+', defence: '7+', morale: '4+', actions: 2 },
    veteran:   { move: 9, attack: '5+', defence: '7+', morale: '3+', actions: 2 },
  },
  inherentAbilities: ['chivalry', 'commander_ability', 'live_by_the_sword', 'ride_down'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'horsemans_pick'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: true,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: [],
  },
  mount: { required: true, options: ['horse', 'barded_horse'] },
  commandGroupUpgrades: ['pennant', 'musician', 'priest'],
  commandGroupFrom: ['mounted_knights', 'mounted_serjeants'],
  minGroupSize: null,
  role: 'commander',
}

// ─── Tier 1.5: Serjeants at Arms ──────────────────────────────────────────────
// PDF p.123 / printed p.122

const serjeant_at_arms: UnitType = {
  id: 'serjeant_at_arms',
  name: 'Serjeant at Arms',
  tier: 1,
  isMounted: false,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 25, regular: 28, veteran: 31 },
  stats: {
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['commander_ability', 'martial_respect'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'two_handed_weapon', 'bill', 'spear'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: {
    required: true,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: ['two_handed_weapon', 'bill'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: ['pennant', 'musician', 'priest'],
  commandGroupFrom: ['serjeants', 'spearmen'],
  minGroupSize: null,
  role: 'commander',
}

const serjeant_at_arms_mounted: UnitType = {
  id: 'serjeant_at_arms_mounted',
  name: 'Serjeant at Arms (Mounted)',
  tier: 1,
  isMounted: true,
  isCommander: true,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 27, regular: 30, veteran: 33 },
  stats: {
    irregular: { move: 9, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 9, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 9, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['commander_ability', 'martial_respect'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'spear'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: {
    required: true,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: [],
  },
  mount: { required: true, options: ['horse', 'barded_horse'] },
  commandGroupUpgrades: ['pennant', 'musician', 'priest'],
  commandGroupFrom: ['mounted_serjeants'],
  minGroupSize: null,
  role: 'commander',
}

// ─── Tier 1: Warriors ─────────────────────────────────────────────────────────
// PDF pp.124–126 / printed pp.123–125

const knights: UnitType = {
  id: 'knights',
  name: 'Knights',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 11, regular: 16, veteran: 19 },
  stats: {
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['chivalry', 'live_by_the_sword'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'two_handed_weapon'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: ['two_handed_weapon'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'infantry',
}

const mounted_knights: UnitType = {
  id: 'mounted_knights',
  name: 'Mounted Knights',
  tier: 1,
  isMounted: true,
  isCommander: false,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 14, regular: 18, veteran: 21 },
  stats: {
    irregular: { move: 9, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 9, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 9, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['chivalry', 'live_by_the_sword', 'ride_down'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'horsemans_pick'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: true, options: ['mail'] },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: [],
  },
  mount: { required: true, options: ['horse', 'barded_horse'] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 2,
  role: 'cavalry',
}

const serjeants: UnitType = {
  id: 'serjeants',
  name: 'Serjeants',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 12, regular: 15, veteran: 18 },
  stats: {
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['martial_respect'],
  meleeWeapons: {
    required: true,
    // Sword and Bill locked to Regular+ per PDF p.125
    options: ['spear', 'sword', 'mace', 'falchion', 'two_handed_weapon', 'bill'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: {
    required: true,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: ['two_handed_weapon', 'bill'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'infantry',
}

const marksman_serjeants: UnitType = {
  id: 'marksman_serjeants',
  name: 'Marksman Serjeants',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 12, regular: 16, veteran: 18 },
  stats: {
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['martial_respect', 'marksman'],
  // Crossbow is the ONLY weapon option for Marksman Serjeants
  meleeWeapons: { required: false, options: [] },
  rangedWeapons: {
    required: true,
    options: ['crossbow'],
  },
  armour: {
    required: true,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  // No shield: crossbow is TWO HANDED
  shield: {
    required: false,
    options: [],
    excludeIfWeapon: ['crossbow'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'ranged',
}

const mounted_serjeants: UnitType = {
  id: 'mounted_serjeants',
  name: 'Mounted Serjeants',
  tier: 1,
  isMounted: true,
  isCommander: false,
  experienceOptions: ['irregular', 'regular', 'veteran'],
  baseCosts: { irregular: 12, regular: 15, veteran: 18 },
  stats: {
    irregular: { move: 9, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 9, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 9, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['martial_respect'],
  meleeWeapons: {
    required: true,
    options: ['sword', 'mace', 'falchion', 'spear'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: {
    required: true,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  shield: {
    required: false,
    options: ['medium_shield', 'large_shield'],
    excludeIfWeapon: [],
  },
  mount: { required: true, options: ['horse', 'barded_horse'] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 2,
  role: 'cavalry',
}

const bowmen: UnitType = {
  id: 'bowmen',
  name: 'Bowmen',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['green', 'irregular', 'regular', 'veteran'],
  baseCosts: { green: 8, irregular: 11, regular: 15, veteran: 18 },
  stats: {
    green:     { move: 6, attack: '8+', defence: '7+', morale: '6+', actions: 1 },
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['every_bloody_sunday'],
  meleeWeapons: { required: false, options: [] },
  // Bow is the ONLY option
  rangedWeapons: { required: true, options: ['bow'] },
  armour: {
    required: false,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  // No shield: bow is TWO HANDED
  shield: {
    required: false,
    options: [],
    excludeIfWeapon: ['bow'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'ranged',
}

const crossbowmen: UnitType = {
  id: 'crossbowmen',
  name: 'Crossbowmen',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['green', 'irregular', 'regular', 'veteran'],
  baseCosts: { green: 8, irregular: 11, regular: 14, veteran: 17 },
  stats: {
    green:     { move: 6, attack: '8+', defence: '7+', morale: '6+', actions: 1 },
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: [],
  meleeWeapons: { required: false, options: [] },
  rangedWeapons: { required: true, options: ['crossbow'] },
  armour: {
    required: false,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  // No shield: crossbow is TWO HANDED
  shield: {
    required: false,
    options: [],
    excludeIfWeapon: ['crossbow'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'ranged',
}

const spearmen: UnitType = {
  id: 'spearmen',
  name: 'Spearmen',
  tier: 1,
  isMounted: false,
  isCommander: false,
  experienceOptions: ['green', 'irregular', 'regular', 'veteran'],
  baseCosts: { green: 8, irregular: 11, regular: 15, veteran: 18 },
  stats: {
    green:     { move: 6, attack: '8+', defence: '7+', morale: '6+', actions: 1 },
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
    veteran:   { move: 6, attack: '5+', defence: '7+', morale: '3+', actions: 1 },
  },
  inherentAbilities: ['brace'],
  meleeWeapons: {
    required: true,
    options: ['spear', 'bill'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: {
    required: false,
    options: ['padded', 'mail'],
    mailMinExperience: 'regular',
  },
  shield: {
    required: false,
    options: ['small_shield', 'medium_shield', 'large_shield'],
    excludeIfWeapon: ['bill'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'infantry',
}

const militant_monks: UnitType = {
  id: 'militant_monks',
  name: 'Militant Monks',
  tier: 1,
  isMounted: false,
  isCommander: false,
  // Green/Irregular/Regular only — no Veteran (PDF p.126)
  experienceOptions: ['green', 'irregular', 'regular'],
  baseCosts: { green: 6, irregular: 11, regular: 15 },
  stats: {
    green:     { move: 6, attack: '8+', defence: '7+', morale: '6+', actions: 1 },
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
    regular:   { move: 6, attack: '6+', defence: '7+', morale: '4+', actions: 1 },
  },
  inherentAbilities: ['faith'],
  meleeWeapons: {
    required: true,
    // Hand Weapon, Spear always; Sword and TWW locked to Regular+ (PDF p.126)
    options: ['hand_weapon', 'spear', 'sword', 'two_handed_weapon'],
  },
  rangedWeapons: { required: false, options: [] },
  armour: { required: false, options: [] },
  shield: {
    required: false,
    options: ['small_shield', 'medium_shield'],
    excludeIfWeapon: ['two_handed_weapon'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'infantry',
}

const levy: UnitType = {
  id: 'levy',
  name: 'Levy',
  tier: 1,
  isMounted: false,
  isCommander: false,
  // Green and Irregular ONLY — no Regular or Veteran (PDF p.126)
  experienceOptions: ['green', 'irregular'],
  baseCosts: { green: 6, irregular: 11 },
  stats: {
    green:     { move: 6, attack: '8+', defence: '7+', morale: '6+', actions: 1 },
    irregular: { move: 6, attack: '7+', defence: '7+', morale: '5+', actions: 1 },
  },
  inherentAbilities: ['sorry_mlord'],
  meleeWeapons: {
    required: true,
    options: ['hand_weapon', 'spear', 'improvised_two_handed_weapon'],
  },
  // Sling is a ranged weapon for Levy
  rangedWeapons: { required: false, options: ['sling'] },
  armour: { required: false, options: [] },
  shield: {
    required: false,
    options: ['small_shield'],
    excludeIfWeapon: ['improvised_two_handed_weapon'],
  },
  mount: { required: false, options: [] },
  commandGroupUpgrades: [],
  commandGroupFrom: [],
  minGroupSize: 4,
  role: 'support',
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const UNIT_TYPES: UnitType[] = [
  // Commanders
  baron_foot,
  baron_mounted,
  lord_foot,
  lord_mounted,
  serjeant_at_arms,
  serjeant_at_arms_mounted,
  // Warriors
  knights,
  mounted_knights,
  serjeants,
  marksman_serjeants,
  mounted_serjeants,
  bowmen,
  crossbowmen,
  spearmen,
  militant_monks,
  levy,
]

export const unitTypeById = Object.fromEntries(
  UNIT_TYPES.map(u => [u.id, u])
) as Record<string, UnitType>

// Inherent abilities that only activate at a minimum experience level.
// Key: unitTypeId → { abilityId: minExperience }
// Used for display filtering in GroupCard and summary views.
export const CONDITIONAL_INHERENT: Record<string, Record<string, string>> = {
  knights:             { live_by_the_sword: 'regular' },
  mounted_knights:     { live_by_the_sword: 'regular' },
  marksman_serjeants:  { marksman: 'regular' },
  spearmen:            { brace: 'regular' },
}

export const COMMANDER_UNIT_TYPES = UNIT_TYPES.filter(u => u.isCommander)
export const WARRIOR_UNIT_TYPES = UNIT_TYPES.filter(u => !u.isCommander)
