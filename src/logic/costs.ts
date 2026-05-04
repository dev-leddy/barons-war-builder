import type { Group, Retinue, GroupEquipment, Commander, KnightCommanderData } from '@/src/types'
import { unitTypeById } from '@/src/data/unitTypes'
import { weaponById, armourById, shieldById, mountById } from '@/src/data/equipment'
import { abilityById } from '@/src/data/abilities'
import { dramatisPersonaeById, dpAbilityById } from '@/src/data/dramatisPersonae'

export function computeEquipmentCost(equipment: GroupEquipment): number {
  let cost = 0
  if (equipment.meleeWeapon) cost += weaponById[equipment.meleeWeapon]?.cost ?? 0
  if (equipment.rangedWeapon) cost += weaponById[equipment.rangedWeapon]?.cost ?? 0
  if (equipment.armour) cost += armourById[equipment.armour]?.cost ?? 0
  if (equipment.shield) cost += shieldById[equipment.shield]?.cost ?? 0
  if (equipment.mount) cost += mountById[equipment.mount]?.cost ?? 0
  return cost
}

function computeAbilitiesCost(abilityIds: string[]): number {
  return abilityIds.reduce((sum, id) => {
    const a = abilityById[id]
    // Inherent abilities have 0 purchasable cost; DP abilities looked up separately
    return sum + (a?.cost ?? dpAbilityById[id]?.cost ?? 0)
  }, 0)
}

export function computeCommandGroupUpgradeCost(
  commander: Commander,
  unitTypeId: string
): number {
  // Banner = 9, Pennant = 7, Musician = 4, Priest = 4 (PDF p.129)
  const upgrades = commander ? [] as string[] : []
  // Upgrades are stored on the Group, not the Commander sub-object
  return 0 // called from computeGroupCost which passes the group
}

export function computeCommanderCost(commander: Commander): number {
  if (commander.isDramatisPersonae && commander.dramatisPersonaeId) {
    const dp = dramatisPersonaeById[commander.dramatisPersonaeId]
    if (!dp) return 0
    return dp.pointsCost + computeEquipmentCost(commander.equipment)
  }

  if (commander.isKnightCommander && commander.knightCommanderData) {
    return computeKnightCommanderCost(commander.knightCommanderData, commander.equipment)
  }

  const unitType = unitTypeById[commander.unitTypeId]
  if (!unitType) return 0

  const baseCost = unitType.baseCosts[commander.experience] ?? 0
  const equipCost = computeEquipmentCost(commander.equipment)
  const abilityCost = computeAbilitiesCost(commander.purchasedAbilities)

  return baseCost + equipCost + abilityCost
}

export function computeKnightCommanderCost(
  data: KnightCommanderData,
  equipment: GroupEquipment
): number {
  // PDF pp.130–131 / printed pp.129–130
  // Baron base = 27pts, Lord base = 17pts
  const base = data.baseType === 'baron' ? 27 : 17
  const attackUpgrade = data.statUpgrades.attack * 2
  const defenceUpgrade = data.statUpgrades.defence * 2
  const moraleUpgrade = data.statUpgrades.morale * 1
  // Inherent: Commander (free), must take Chivalry (+1), may take Live by the Sword (+1)
  const inherentAbilities = 1  // Chivalry baked in
  const equipCost = computeEquipmentCost(equipment)
  return base + attackUpgrade + defenceUpgrade + moraleUpgrade + inherentAbilities + equipCost
}

// Command Group upgrade costs: Banner=9, Pennant=7, Musician=4, Priest=4
const CG_UPGRADE_COSTS: Record<string, number> = {
  banner: 9,
  pennant: 7,
  musician: 4,
  priest: 4,
}

export function computeGroupCost(group: Group): number {
  const unitType = unitTypeById[group.unitTypeId]
  if (!unitType) return 0

  let total = 0

  if (unitType.isCommander) {
    // Commander groups: commander cost + CG upgrades
    if (group.commander) {
      total += computeCommanderCost(group.commander)
    }

    // Command Group warrior cost (the attached group members)
    // The command group's warriors use their own unit type separately,
    // but for the simple model the commander IS the command group entry.
    // CG upgrades are on the Group object
    const upgrade = group.commandGroupUpgrade
    if (upgrade.banner) total += CG_UPGRADE_COSTS.banner
    if (upgrade.pennant) total += CG_UPGRADE_COSTS.pennant
    if (upgrade.musician) total += CG_UPGRADE_COSTS.musician
    if (upgrade.priest) total += CG_UPGRADE_COSTS.priest
  } else {
    // Warrior group: (baseCost + equipCost + abilityCost) × count
    const baseCostPerWarrior = unitType.baseCosts[group.experience] ?? 0
    const equipCostPerWarrior = computeEquipmentCost(group.equipment)
    const abilityCostPerWarrior = computeAbilitiesCost(group.purchasedAbilities)
    const costPerWarrior = baseCostPerWarrior + equipCostPerWarrior + abilityCostPerWarrior
    total = costPerWarrior * group.count
  }

  return total
}

export function computeRetinueCost(retinue: Retinue): number {
  return retinue.groups.reduce((sum, g) => sum + computeGroupCost(g), 0)
}

export function computeCostPerWarrior(group: Group): number {
  const unitType = unitTypeById[group.unitTypeId]
  if (!unitType || unitType.isCommander) return 0
  const base = unitType.baseCosts[group.experience] ?? 0
  const equip = computeEquipmentCost(group.equipment)
  const abilities = computeAbilitiesCost(group.purchasedAbilities)
  return base + equip + abilities
}
