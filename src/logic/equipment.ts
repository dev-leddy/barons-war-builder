import type {
  UnitType,
  Experience,
  MeleeWeaponId,
  RangedWeaponId,
  ArmourId,
  ShieldId,
  MountId,
  GroupEquipment,
} from '@/src/types'
import { weaponById } from '@/src/data/equipment'

/** Returns melee weapon options available to a unit at a given experience level. */
export function getAvailableMeleeWeapons(
  unitType: UnitType,
  experience: Experience
): MeleeWeaponId[] {
  // Some weapons are restricted to Regular+ (e.g. Sword and Bill for Serjeants)
  // These restrictions are encoded per unit type in the meleeWeapons.options list.
  // The full list is always returned here; experience gating is enforced in validation.
  return unitType.meleeWeapons.options
}

export function getAvailableRangedWeapons(
  unitType: UnitType,
): RangedWeaponId[] {
  return unitType.rangedWeapons.options
}

export function getAvailableArmour(
  unitType: UnitType,
  experience: Experience
): ArmourId[] {
  const options = unitType.armour.options
  if (!unitType.armour.mailMinExperience) return options
  // Mail locked to Regular+ for some units
  const EXP_ORDER: Experience[] = ['green', 'irregular', 'regular', 'veteran']
  const minIdx = EXP_ORDER.indexOf(unitType.armour.mailMinExperience)
  const curIdx = EXP_ORDER.indexOf(experience)
  if (curIdx < minIdx) {
    return options.filter(a => a !== 'mail') as ArmourId[]
  }
  return options
}

export function getAvailableShields(
  unitType: UnitType,
  selectedMeleeWeapon: MeleeWeaponId | null,
  selectedRangedWeapon: RangedWeaponId | null,
): ShieldId[] {
  const allWeapons: string[] = [
    ...(selectedMeleeWeapon ? [selectedMeleeWeapon] : []),
    ...(selectedRangedWeapon ? [selectedRangedWeapon] : []),
  ]
  const excluded = unitType.shield.excludeIfWeapon as string[]
  if (allWeapons.some(w => excluded.includes(w))) return []
  return unitType.shield.options
}

export function getAvailableMounts(unitType: UnitType): MountId[] {
  return unitType.mount.options
}

/** True if the current weapon selection blocks shields (TWO HANDED). */
export function isTwoHandedEquipped(equipment: GroupEquipment): boolean {
  const melee = equipment.meleeWeapon ? weaponById[equipment.meleeWeapon] : null
  const ranged = equipment.rangedWeapon ? weaponById[equipment.rangedWeapon] : null
  return !!(melee?.isTwoHanded || ranged?.isTwoHanded)
}

/** True if lance can be added as a secondary weapon (mounted only, doesn't replace). */
export function canEquipLance(unitType: UnitType, equipment: GroupEquipment): boolean {
  return unitType.isMounted && equipment.mount !== null
}

/** Build the default (cheapest valid) equipment for a unit type at given experience. */
export function defaultEquipment(unitType: UnitType, experience: Experience): GroupEquipment {
  const meleeOptions = getAvailableMeleeWeapons(unitType, experience)
  const rangedOptions = getAvailableRangedWeapons(unitType)
  const rangedWeapon = (rangedOptions[0] ?? null) as RangedWeaponId | null

  // Pick the first melee option (usually the cheapest/most basic)
  // For ranged-only units (Bowmen, Crossbowmen, Marksman Serjeants) there's no melee
  const meleeWeapon = (meleeOptions[0] ?? 'hand_weapon') as MeleeWeaponId

  const armourOptions = getAvailableArmour(unitType, experience)
  const armour = (armourOptions[0] ?? null) as ArmourId | null

  const shieldOptions = getAvailableShields(unitType, meleeWeapon, rangedWeapon)
  // Default to first shield option if available (not just when required).
  // Units like Knights have optional shields but should start equipped by default.
  // If the chosen weapon excludes shields (TWW, Bow, etc.) shieldOptions will be empty → null.
  const shield = (shieldOptions[0] ?? null) as ShieldId | null

  const mountOptions = getAvailableMounts(unitType)
  const mount = (unitType.mount.required ? mountOptions[0] ?? null : null) as MountId | null

  return { meleeWeapon, rangedWeapon, armour, shield, mount }
}
