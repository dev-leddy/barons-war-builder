import type { UnitType, Experience, Ability } from '@/src/types'
import { PURCHASABLE_ABILITIES } from '@/src/data/abilities'

/**
 * Returns the purchasable abilities available to a group of the given unit type
 * and experience, given its current selection context.
 */
export function getAvailableAbilities(opts: {
  unitType: UnitType
  experience: Experience
  isRetinueLeader: boolean
  isMounted: boolean
  hasArmour: boolean
  hasBowOrCrossbow: boolean
  unitTypeId: string
}): Ability[] {
  const { unitType, experience, isRetinueLeader, isMounted, hasArmour, hasBowOrCrossbow, unitTypeId } = opts

  return PURCHASABLE_ABILITIES.filter(ability => {
    // Check each restriction
    for (const restriction of ability.restrictions) {
      switch (restriction) {
        case 'commander_only':
          if (!unitType.isCommander) return false
          break
        case 'retinue_leader_only':
          if (!isRetinueLeader) return false
          break
        case 'mounted_knights_only':
          if (unitTypeId !== 'mounted_knights') return false
          break
        case 'horse_or_barded_only':
          if (!isMounted) return false
          break
        case 'unarmoured_only':
          if (hasArmour) return false
          break
        case 'bow_or_crossbow_only':
          if (!hasBowOrCrossbow) return false
          break
      }
    }
    return true
  })
}
