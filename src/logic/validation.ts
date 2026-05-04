import type { Group, Retinue, ValidationError, Experience } from '@/src/types'
import { unitTypeById } from '@/src/data/unitTypes'
import { weaponById } from '@/src/data/equipment'
import { computeRetinueCost } from './costs'

const EXP_ORDER: Experience[] = ['green', 'irregular', 'regular', 'veteran']
function expIndex(e: Experience): number { return EXP_ORDER.indexOf(e) }

// ─── Group-level validation ───────────────────────────────────────────────────

export function validateGroup(group: Group): ValidationError[] {
  const errors: ValidationError[] = []
  const unitType = unitTypeById[group.unitTypeId]
  if (!unitType) {
    errors.push({ code: 'UNKNOWN_UNIT_TYPE', severity: 'error', message: 'Unknown unit type.', groupId: group.id })
    return errors
  }

  // Rule 1+2: Experience must be valid for this unit type
  if (!unitType.experienceOptions.includes(group.experience)) {
    errors.push({
      code: 'INVALID_EXPERIENCE',
      severity: 'error',
      message: `${unitType.name} cannot be ${group.experience} experience.`,
      groupId: group.id,
    })
  }

  // Rule 4: Infantry groups ≥ 4 warriors (PDF p.12)
  if (!unitType.isCommander && !unitType.isMounted && group.count < 4) {
    errors.push({
      code: 'MIN_INFANTRY_SIZE',
      severity: 'error',
      message: `Infantry groups must have at least 4 warriors (currently ${group.count}).`,
      groupId: group.id,
    })
  }

  // Rule 5: Cavalry groups ≥ 2 warriors (PDF p.12)
  if (!unitType.isCommander && unitType.isMounted && group.count < 2) {
    errors.push({
      code: 'MIN_CAVALRY_SIZE',
      severity: 'error',
      message: `Cavalry groups must have at least 2 warriors (currently ${group.count}).`,
      groupId: group.id,
    })
  }

  // Rule 6: TWO HANDED weapon → no shield
  const meleeId = group.equipment.meleeWeapon
  const rangedId = group.equipment.rangedWeapon
  const meleeData = meleeId ? weaponById[meleeId] : null
  const rangedData = rangedId ? weaponById[rangedId] : null
  const isTwoHanded = !!(meleeData?.isTwoHanded || rangedData?.isTwoHanded)

  if (isTwoHanded && group.equipment.shield) {
    errors.push({
      code: 'SHIELD_WITH_TWO_HANDED',
      severity: 'error',
      message: 'Cannot equip a shield with a TWO HANDED weapon.',
      groupId: group.id,
    })
  }

  // Rule 7: Horseman's Pick mounted only
  if (meleeId === 'horsemans_pick' && !unitType.isMounted) {
    errors.push({
      code: 'HORSEMANS_PICK_NOT_MOUNTED',
      severity: 'error',
      message: "Horseman's Pick can only be equipped by a mounted warrior.",
      groupId: group.id,
    })
  }

  // Rule 8: Lance is mounted only
  if (meleeId === 'lance' && !unitType.isMounted) {
    errors.push({
      code: 'LANCE_NOT_MOUNTED',
      severity: 'error',
      message: 'Lance can only be equipped by a mounted warrior.',
      groupId: group.id,
    })
  }

  // Validate equipment choices against unit type options
  if (meleeId && unitType.meleeWeapons.options.length > 0 && !unitType.meleeWeapons.options.includes(meleeId)) {
    errors.push({
      code: 'INVALID_MELEE_WEAPON',
      severity: 'error',
      message: `${unitType.name} cannot equip ${meleeId.replace(/_/g, ' ')}.`,
      groupId: group.id,
    })
  }

  if (rangedId && unitType.rangedWeapons.options.length > 0 && !unitType.rangedWeapons.options.includes(rangedId)) {
    errors.push({
      code: 'INVALID_RANGED_WEAPON',
      severity: 'error',
      message: `${unitType.name} cannot equip ${rangedId.replace(/_/g, ' ')}.`,
      groupId: group.id,
    })
  }

  // Armour must be required if required
  if (unitType.armour.required && !group.equipment.armour) {
    errors.push({
      code: 'ARMOUR_REQUIRED',
      severity: 'error',
      message: `${unitType.name} must be equipped with armour.`,
      groupId: group.id,
    })
  }

  // Mail locked to Regular+ for some unit types
  if (group.equipment.armour === 'mail' && unitType.armour.mailMinExperience) {
    const minIdx = expIndex(unitType.armour.mailMinExperience)
    const curIdx = expIndex(group.experience)
    if (curIdx < minIdx) {
      errors.push({
        code: 'MAIL_EXPERIENCE_LOCKED',
        severity: 'error',
        message: `${unitType.name} must be at least ${unitType.armour.mailMinExperience} experience to equip Mail.`,
        groupId: group.id,
      })
    }
  }

  // Shield must be chosen from allowed options
  if (group.equipment.shield && !unitType.shield.options.includes(group.equipment.shield)) {
    errors.push({
      code: 'INVALID_SHIELD',
      severity: 'error',
      message: `${unitType.name} cannot equip that shield type.`,
      groupId: group.id,
    })
  }

  // Mount required
  if (unitType.mount.required && !group.equipment.mount) {
    errors.push({
      code: 'MOUNT_REQUIRED',
      severity: 'error',
      message: `${unitType.name} must have a mount.`,
      groupId: group.id,
    })
  }

  // Validate purchased abilities
  for (const abilityId of group.purchasedAbilities) {
    // Rule 16: Nimble / Skirmisher: unarmoured only
    if ((abilityId === 'nimble' || abilityId === 'skirmisher') && group.equipment.armour) {
      errors.push({
        code: 'UNARMOURED_ABILITY',
        severity: 'error',
        message: `"${abilityId === 'nimble' ? 'Nimble' : 'Skirmisher'}" can only be chosen by groups without armour.`,
        groupId: group.id,
      })
    }

    // Rule 17: Commander-only abilities
    const commanderOnlyAbilities = [
      'cruelty', 'experienced_tactician', 'formidable',
      'inspired_leader', 'robust', 'veteran_crusader',
    ]
    if (commanderOnlyAbilities.includes(abilityId) && !unitType.isCommander) {
      errors.push({
        code: 'COMMANDER_ONLY_ABILITY',
        severity: 'error',
        message: `"${abilityId.replace(/_/g, ' ')}" can only be chosen by Commander units.`,
        groupId: group.id,
      })
    }

    // Rule 19: Close Ranks — Mounted Knights only
    if (abilityId === 'close_ranks' && group.unitTypeId !== 'mounted_knights') {
      errors.push({
        code: 'CLOSE_RANKS_RESTRICTION',
        severity: 'error',
        message: '"Close Ranks" can only be chosen by a group of Mounted Knights.',
        groupId: group.id,
      })
    }

    // Rule 20: Counter Charge — mounted only
    if (abilityId === 'counter_charge' && !unitType.isMounted) {
      errors.push({
        code: 'COUNTER_CHARGE_RESTRICTION',
        severity: 'error',
        message: '"Counter Charge" can only be chosen by groups mounted on Horses or Barded Horses.',
        groupId: group.id,
      })
    }

    // Rule 25: Master Fletcher — bow/crossbow groups only
    if (abilityId === 'master_fletcher') {
      const hasBow = rangedId === 'bow' || rangedId === 'crossbow'
      if (!hasBow) {
        errors.push({
          code: 'MASTER_FLETCHER_RESTRICTION',
          severity: 'error',
          message: '"Master Fletcher" can only be chosen by groups armed with Bows or Crossbows.',
          groupId: group.id,
        })
      }
    }
  }

  // Command group: validate commander equipment and CG upgrades
  if (unitType.isCommander && group.commander) {
    const cmdEquip = group.commander.equipment

    // Baron-tier: Banner only (not Pennant) — Rule 9
    if (unitType.tier === 3) {
      if (group.commandGroupUpgrade.pennant) {
        errors.push({
          code: 'BARON_PENNANT_INVALID',
          severity: 'error',
          message: 'Baron-tier commanders use a Banner, not a Pennant.',
          groupId: group.id,
        })
      }
    }

    // Lord/Serjeant-tier: Pennant only (not Banner) — Rule 10
    if (unitType.tier <= 2) {
      if (group.commandGroupUpgrade.banner) {
        errors.push({
          code: 'LORD_BANNER_INVALID',
          severity: 'error',
          message: 'Lord and Serjeant-tier commanders use a Pennant, not a Banner.',
          groupId: group.id,
        })
      }
    }

    // Rule 18: Experienced Tactician — Retinue Leader only
    if (group.commander.purchasedAbilities.includes('experienced_tactician') && !group.commander.isRetinueLeader) {
      errors.push({
        code: 'EXPERIENCED_TACTICIAN_NOT_LEADER',
        severity: 'error',
        message: '"Experienced Tactician" can only be chosen by the Retinue Leader.',
        groupId: group.id,
      })
    }

    // Commander mounted-only weapons
    const cmdMelee = cmdEquip.meleeWeapon
    if (cmdMelee === 'horsemans_pick' && !unitType.isMounted) {
      errors.push({
        code: 'COMMANDER_HORSEMANS_PICK',
        severity: 'error',
        message: "Commander cannot equip Horseman's Pick (mounted only).",
        groupId: group.id,
      })
    }

    // Validate commander's own purchased abilities (stored on commander sub-object)
    for (const abilityId of group.commander.purchasedAbilities) {
      if ((abilityId === 'nimble' || abilityId === 'skirmisher') && cmdEquip.armour) {
        errors.push({
          code: 'COMMANDER_UNARMOURED_ABILITY',
          severity: 'error',
          message: `"${abilityId === 'nimble' ? 'Nimble' : 'Skirmisher'}" can only be chosen by commanders without armour.`,
          groupId: group.id,
        })
      }
      if (abilityId === 'close_ranks' && group.unitTypeId !== 'mounted_knights') {
        errors.push({
          code: 'COMMANDER_CLOSE_RANKS',
          severity: 'error',
          message: '"Close Ranks" can only be chosen by a group of Mounted Knights.',
          groupId: group.id,
        })
      }
      if (abilityId === 'counter_charge' && !unitType.isMounted) {
        errors.push({
          code: 'COMMANDER_COUNTER_CHARGE',
          severity: 'error',
          message: '"Counter Charge" can only be chosen by groups mounted on Horses or Barded Horses.',
          groupId: group.id,
        })
      }
      if (abilityId === 'master_fletcher') {
        const hasBow = cmdEquip.rangedWeapon === 'bow' || cmdEquip.rangedWeapon === 'crossbow'
        if (!hasBow) {
          errors.push({
            code: 'COMMANDER_MASTER_FLETCHER',
            severity: 'error',
            message: '"Master Fletcher" can only be chosen by groups armed with Bows or Crossbows.',
            groupId: group.id,
          })
        }
      }
    }
  }

  return errors
}

// ─── Retinue-level validation ─────────────────────────────────────────────────

export function validateRetinue(retinue: Retinue): ValidationError[] {
  const errors: ValidationError[] = []

  // Collect group-level errors
  for (const group of retinue.groups) {
    errors.push(...validateGroup(group))
  }

  // Rule 1: ≥1 Commander group required (PDF p.12)
  const commanderGroups = retinue.groups.filter(g => unitTypeById[g.unitTypeId]?.isCommander)
  if (commanderGroups.length === 0) {
    errors.push({
      code: 'NO_COMMANDER',
      severity: 'error',
      message: 'The retinue must have at least one Commander.',
    })
  }

  // Rule 2: Exactly 1 Retinue Leader (PDF p.13)
  const leaders = retinue.groups.filter(g => g.commander?.isRetinueLeader)
  if (commanderGroups.length > 0 && leaders.length === 0) {
    errors.push({
      code: 'NO_RETINUE_LEADER',
      severity: 'warning',
      message: 'One Commander must be designated as the Retinue Leader.',
    })
  }
  if (leaders.length > 1) {
    errors.push({
      code: 'MULTIPLE_RETINUE_LEADERS',
      severity: 'error',
      message: 'Only one Commander can be designated as the Retinue Leader.',
    })
  }

  // Rule 3: Total points ≤ agreed limit (PDF p.6)
  const totalCost = computeRetinueCost(retinue)
  if (totalCost > retinue.pointsLimit) {
    errors.push({
      code: 'OVER_POINTS_LIMIT',
      severity: 'warning',
      message: `Retinue costs ${totalCost} pts, exceeds the ${retinue.pointsLimit} pt limit by ${totalCost - retinue.pointsLimit} pts.`,
    })
  }

  // Rule 23: Each Commander attaches to exactly one Group (PDF p.13)
  // (Enforced by data model — each Group has at most one Commander)

  // Rule 11a: Each commander must have an explicitly linked warrior group (PDF p.13)
  for (const cmdGroup of commanderGroups) {
    const cmdUnitType = unitTypeById[cmdGroup.unitTypeId]
    if (!cmdUnitType || cmdUnitType.commandGroupFrom.length === 0) continue
    const hasLinkedWarrior = retinue.groups.some(g => g.commanderGroupId === cmdGroup.id)
    if (!hasLinkedWarrior) {
      const validTypes = cmdUnitType.commandGroupFrom
        .map(id => unitTypeById[id]?.name ?? id)
        .join(' or ')
      errors.push({
        code: 'MISSING_COMMAND_GROUP',
        severity: 'warning',
        message: `${cmdUnitType.name} has no Command Group. Attach a ${validTypes} warrior group.`,
        groupId: cmdGroup.id,
      })
    }
  }

  // Rule 11b: Linked warrior group must be a compatible type
  for (const g of retinue.groups) {
    if (!g.commanderGroupId) continue
    const cmdGroup = retinue.groups.find(cg => cg.id === g.commanderGroupId)
    if (!cmdGroup) {
      errors.push({
        code: 'DANGLING_COMMAND_GROUP_LINK',
        severity: 'error',
        message: 'This warrior group references a commander that no longer exists.',
        groupId: g.id,
      })
      continue
    }
    const cmdUnitType = unitTypeById[cmdGroup.unitTypeId]
    if (cmdUnitType && !cmdUnitType.commandGroupFrom.includes(g.unitTypeId)) {
      errors.push({
        code: 'INCOMPATIBLE_COMMAND_GROUP',
        severity: 'error',
        message: `${unitTypeById[g.unitTypeId]?.name ?? g.unitTypeId} cannot form the Command Group for a ${cmdUnitType.name}.`,
        groupId: g.id,
      })
    }
  }

  // Dramatis Personae: at most one of each character
  const dpIds = retinue.groups
    .filter(g => g.commander?.isDramatisPersonae)
    .map(g => g.commander!.dramatisPersonaeId)

  const dpSet = new Set<string | null>()
  for (const dpId of dpIds) {
    if (dpId && dpSet.has(dpId)) {
      errors.push({
        code: 'DUPLICATE_DRAMATIS_PERSONAE',
        severity: 'error',
        message: 'Only one of each Dramatis Personae character can be included per retinue.',
      })
    }
    dpSet.add(dpId)
  }

  return errors
}

/** Partition errors by severity for UI display. */
export function partitionErrors(errors: ValidationError[]) {
  return {
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    info: errors.filter(e => e.severity === 'info'),
  }
}
