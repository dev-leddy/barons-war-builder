import type { WeaponData, ArmourData, ShieldData, MountData } from '@/src/types'

// PDF pp.127–129 / printed pp.126–128

export const MELEE_WEAPONS: WeaponData[] = [
  {
    id: 'hand_weapon',
    name: 'Hand Weapon',
    cost: 0,
    attackBonus: 0,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: [],
  },
  {
    id: 'battle_axe',
    name: 'Battle Axe',
    cost: 1,
    attackBonus: 0,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['CUTTING EDGE: -1 to enemy Shield rolls'],
  },
  {
    id: 'improvised_two_handed_weapon',
    name: 'Improvised Two Handed Weapon',
    cost: 1,
    attackBonus: 1,
    isTwoHanded: true,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['SLOW: group cannot Run or Charge', 'TWO HANDED'],
  },
  {
    id: 'spear',
    name: 'Spear',
    cost: 1,
    attackBonus: 0,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['REACH (2" instead of 1")'],
  },
  {
    id: 'falchion',
    name: 'Falchion',
    cost: 2,
    attackBonus: 1,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['SLASHING: -1 Defence vs unarmoured/padded'],
  },
  {
    id: 'sword',
    name: 'Sword',
    cost: 2,
    attackBonus: 1,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['PARRY: +1 Shield roll in Melee'],
  },
  {
    id: 'mace',
    name: 'Mace',
    cost: 2,
    attackBonus: 1,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['BLUNT TRAUMA: no Shield rolls vs Mace'],
  },
  {
    id: 'bill',
    name: 'Bill/Polearm',
    cost: 3,
    attackBonus: 1,
    isTwoHanded: true,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['HACKING: -1 Defence', 'REACH (2")', 'TWO HANDED'],
  },
  {
    id: 'horsemans_pick',
    name: "Horseman's Pick",
    cost: 3,
    attackBonus: 1,
    isTwoHanded: false,
    isMountedOnly: true,
    isRanged: false,
    specialRules: ['MOUNTED only', 'PIERCING when charging: target\'s armour Defence bonus is ignored'],
  },
  {
    id: 'two_handed_weapon',
    name: 'Two Handed Weapon',
    cost: 3,
    attackBonus: 2,
    isTwoHanded: true,
    isMountedOnly: false,
    isRanged: false,
    specialRules: ['PARRY: +1 Shield roll in Melee', 'SLOW: group cannot Run or Charge', 'TWO HANDED'],
  },
  {
    id: 'lance',
    name: 'Lance',
    cost: 4,
    attackBonus: 2,
    isTwoHanded: false,
    isMountedOnly: true,
    isRanged: false,
    // Lance does not replace equipped weapon — added alongside primary weapon
    specialRules: ['LANCE: single use on the first charge only', 'PIERCING: target\'s armour Defence bonus is ignored', 'SHOCK: enemy takes an Order check after losing melee'],
  },
]

export const RANGED_WEAPONS: WeaponData[] = [
  {
    id: 'sling',
    name: 'Sling',
    cost: 1,
    attackBonus: 0,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: true,
    rangeShort: 10,
    rangeLong: undefined,
    specialRules: ['MOVE AND SHOOT 6"', 'QUICK SHOT'],
  },
  {
    id: 'javelin',
    name: 'Javelin',
    cost: 1,
    attackBonus: 0,
    isTwoHanded: false,
    isMountedOnly: false,
    isRanged: true,
    rangeShort: 6,
    rangeLong: undefined,
    specialRules: ['MOVE AND SHOOT 6"', 'RUN UP'],
  },
  {
    id: 'bow',
    name: 'Bow',
    cost: 1,
    attackBonus: 0,
    isTwoHanded: true,
    isMountedOnly: false,
    isRanged: true,
    rangeShort: 10,
    rangeLong: 20,
    specialRules: ['MOVE AND SHOOT 3" (short range only)', 'TWO HANDED'],
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    cost: 2,
    attackBonus: 0,
    isTwoHanded: true,
    isMountedOnly: false,
    isRanged: true,
    rangeShort: 10,
    rangeLong: 20,
    specialRules: ['CRITICAL HIT', 'MOVE AND SHOOT 3"', 'RELOAD', 'TWO HANDED'],
  },
]

export const ALL_WEAPONS: WeaponData[] = [...MELEE_WEAPONS, ...RANGED_WEAPONS]

export const ARMOUR: ArmourData[] = [
  {
    id: 'padded',
    name: 'Padded Armour',
    cost: 1,
    defenceBonus: 1,
    moveModifier: -1,
    specialRules: [],
  },
  {
    id: 'mail',
    name: 'Mail',
    cost: 2,
    defenceBonus: 2,
    moveModifier: -2,
    specialRules: ['HEAVY: half-move in Difficult Terrain'],
  },
]

export const SHIELDS: ShieldData[] = [
  { id: 'small_shield', name: 'Small Shield', cost: 2, shieldRoll: '9+' },
  { id: 'medium_shield', name: 'Medium Shield', cost: 3, shieldRoll: '8+' },
  { id: 'large_shield', name: 'Large Shield', cost: 4, shieldRoll: '7+' },
]

export const MOUNTS: MountData[] = [
  {
    id: 'horse',
    name: 'Horse',
    cost: 3,
    moveBonus: 3,
    defenceBonus: 0,
  },
  {
    id: 'barded_horse',
    name: 'Barded Horse',
    cost: 5,
    moveBonus: 3,
    defenceBonus: 1,
  },
]

// Lookup helpers
export const weaponById = Object.fromEntries(ALL_WEAPONS.map(w => [w.id, w])) as Record<string, WeaponData>
export const armourById = Object.fromEntries(ARMOUR.map(a => [a.id, a])) as Record<string, ArmourData>
export const shieldById = Object.fromEntries(SHIELDS.map(s => [s.id, s])) as Record<string, ShieldData>
export const mountById = Object.fromEntries(MOUNTS.map(m => [m.id, m])) as Record<string, MountData>
