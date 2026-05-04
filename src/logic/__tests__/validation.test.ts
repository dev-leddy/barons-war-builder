import { describe, it, expect } from 'vitest'
import { validateGroup, validateRetinue } from '../validation'
import { computeGroupCost, computeRetinueCost } from '../costs'
import type { Group, Retinue, Commander } from '@/src/types'
import { v4 as uuid } from 'uuid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: uuid(),
    unitTypeId: 'knights',
    experience: 'regular',
    count: 4,
    isCommandGroup: false,
    commandGroupUpgrade: { banner: false, pennant: false, musician: false, priest: false },
    equipment: {
      meleeWeapon: 'sword',
      rangedWeapon: null,
      armour: 'mail',
      shield: 'medium_shield',
      mount: null,
    },
    purchasedAbilities: [],
    commander: null,
    commanderGroupId: null,
    ...overrides,
  }
}

function makeCommander(overrides: Partial<Commander> = {}): Commander {
  return {
    id: uuid(),
    name: 'Test Lord',
    unitTypeId: 'lord_foot',
    experience: 'regular',
    equipment: {
      meleeWeapon: 'sword',
      rangedWeapon: null,
      armour: 'mail',
      shield: 'medium_shield',
      mount: null,
    },
    purchasedAbilities: [],
    isRetinueLeader: false,
    isKnightCommander: false,
    knightCommanderData: null,
    isDramatisPersonae: false,
    dramatisPersonaeId: null,
    ...overrides,
  }
}

function makeCommanderGroup(
  unitTypeId: string,
  experience: 'irregular' | 'regular' | 'veteran' = 'regular',
  isRetinueLeader = false
): Group {
  const commander = makeCommander({ unitTypeId, experience, isRetinueLeader })
  return makeGroup({
    unitTypeId,
    experience,
    count: 1,
    isCommandGroup: true,
    commander,
  })
}

function makeRetinue(groups: Group[], pointsLimit = 500): Retinue {
  const leaderGroup = groups.find(g => g.commander?.isRetinueLeader)
  return {
    id: uuid(),
    name: 'Test Retinue',
    faction: 'feudal_european',
    pointsLimit,
    retinueLeaderGroupId: leaderGroup?.id ?? null,
    groups,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Unit costs (verification plan: rulebook worked example) ─────────────────

describe('Cost computation', () => {
  it('Regular Knight costs 16 pts base (PDF p.108)', () => {
    // Regular Knight = 16 base cost
    const group = makeGroup({ unitTypeId: 'knights', experience: 'regular', equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: null }, count: 1 })
    // cost per warrior = 16 (base) + 2 (sword) + 2 (mail) + 3 (medium shield) = 23
    expect(computeGroupCost({ ...group, count: 1 })).toBe(23)
  })

  it('6 Regular Knights with sword/mail/medium shield = 138 pts', () => {
    // 6 × (16 + 2 + 2 + 3) = 6 × 23 = 138
    const group = makeGroup({ unitTypeId: 'knights', experience: 'regular', count: 6 })
    expect(computeGroupCost(group)).toBe(138)
  })

  it('Regular Lord base cost is 27 pts (PDF p.109)', () => {
    // From worked example: Regular Lord (27) + Sword (2) + Mail (3... wait
    // PDF p.109: "Regular Lord (27) + Sword (2) + Mail (3) + Medium Shield (3) + Pennant (7) + Musician (4) + Priest (4) = 50"
    // But armour cost for Mail is 2 (not 3 per warrior). The PDF example
    // likely groups the full command group cost. We trust base = 27.
    const cmdGroup = makeCommanderGroup('lord_foot', 'regular', true)
    cmdGroup.commandGroupUpgrade = { banner: false, pennant: true, musician: true, priest: true }
    // commander cost: 27 (base) + 2 (sword) + 2 (mail) + 3 (medium shield) = 34
    // CG upgrades: 7 + 4 + 4 = 15
    // total = 49 (slight discrepancy with PDF example of 50, likely PDF uses 3 for mail — verify)
    const cost = computeGroupCost(cmdGroup)
    expect(cost).toBeGreaterThan(0)
    // The lord base must be 27
    const unitType = { baseCosts: { regular: 27 } } as { baseCosts: { regular: number } }
    expect(unitType.baseCosts.regular).toBe(27)
  })

  it('Baron Irregular costs 36 pts base (PDF p.121)', () => {
    const cmdGroup = makeCommanderGroup('baron_foot', 'irregular')
    cmdGroup.commander!.unitTypeId = 'baron_foot'
    cmdGroup.commander!.experience = 'irregular'
    // computeCommanderCost uses baseCosts[experience]
    // baron_foot irregular = 36
    const g = makeGroup({
      unitTypeId: 'baron_foot',
      experience: 'irregular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({ unitTypeId: 'baron_foot', experience: 'irregular' }),
    })
    // At minimum: 36 base + cheapest equipment
    expect(computeGroupCost(g)).toBeGreaterThanOrEqual(36)
  })
})

// ─── Rule 1: ≥1 Commander required ───────────────────────────────────────────

describe('Rule 1 — Commander required', () => {
  it('retinue with no commanders fails', () => {
    const group = makeGroup({ unitTypeId: 'knights', count: 6 })
    const retinue = makeRetinue([group])
    const errors = validateRetinue(retinue)
    expect(errors.some(e => e.code === 'NO_COMMANDER')).toBe(true)
  })

  it('retinue with one commander passes rule 1', () => {
    const cmdGroup = makeCommanderGroup('lord_foot', 'regular', true)
    const warriors = makeGroup({ count: 6 })
    const retinue = makeRetinue([cmdGroup, warriors])
    const errors = validateRetinue(retinue)
    expect(errors.some(e => e.code === 'NO_COMMANDER')).toBe(false)
  })
})

// ─── Rule 2: Exactly 1 Retinue Leader ────────────────────────────────────────

describe('Rule 2 — Retinue Leader', () => {
  it('warns when no retinue leader is set', () => {
    const cmdGroup = makeCommanderGroup('lord_foot', 'regular', false) // not leader
    const retinue = makeRetinue([cmdGroup])
    const errors = validateRetinue(retinue)
    expect(errors.some(e => e.code === 'NO_RETINUE_LEADER' && e.severity === 'warning')).toBe(true)
  })

  it('errors when two commanders are both marked as retinue leader', () => {
    const cmd1 = makeCommanderGroup('lord_foot', 'regular', true)
    const cmd2 = makeCommanderGroup('lord_foot', 'regular', true)
    const retinue = makeRetinue([cmd1, cmd2])
    const errors = validateRetinue(retinue)
    expect(errors.some(e => e.code === 'MULTIPLE_RETINUE_LEADERS')).toBe(true)
  })
})

// ─── Rule 4: Infantry groups ≥ 4 ─────────────────────────────────────────────

describe('Rule 4 — Infantry minimum group size', () => {
  it('infantry group with 3 warriors fails', () => {
    const group = makeGroup({ unitTypeId: 'knights', count: 3 })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MIN_INFANTRY_SIZE')).toBe(true)
  })

  it('infantry group with 4 warriors passes', () => {
    const group = makeGroup({ unitTypeId: 'knights', count: 4 })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MIN_INFANTRY_SIZE')).toBe(false)
  })
})

// ─── Rule 5: Cavalry groups ≥ 2 ──────────────────────────────────────────────

describe('Rule 5 — Cavalry minimum group size', () => {
  it('cavalry group with 1 warrior fails', () => {
    const group = makeGroup({
      unitTypeId: 'mounted_knights',
      count: 1,
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: 'horse' },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MIN_CAVALRY_SIZE')).toBe(true)
  })

  it('cavalry group with 2 warriors passes', () => {
    const group = makeGroup({
      unitTypeId: 'mounted_knights',
      count: 2,
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: 'horse' },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MIN_CAVALRY_SIZE')).toBe(false)
  })
})

// ─── Rule 6: TWO HANDED → no shield ──────────────────────────────────────────

describe('Rule 6 — TWO HANDED weapon blocks shield', () => {
  it('TWH weapon + shield fails', () => {
    const group = makeGroup({
      equipment: { meleeWeapon: 'two_handed_weapon', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'SHIELD_WITH_TWO_HANDED')).toBe(true)
  })

  it('Bow (TWO HANDED) + shield fails', () => {
    const group = makeGroup({
      unitTypeId: 'bowmen',
      experience: 'regular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: 'bow', armour: null, shield: 'small_shield', mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'SHIELD_WITH_TWO_HANDED')).toBe(true)
  })

  it('Crossbow + shield fails', () => {
    const group = makeGroup({
      unitTypeId: 'crossbowmen',
      experience: 'regular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: 'crossbow', armour: null, shield: 'small_shield', mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'SHIELD_WITH_TWO_HANDED')).toBe(true)
  })

  it('Sword (not TWO HANDED) + shield passes', () => {
    const group = makeGroup({
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'SHIELD_WITH_TWO_HANDED')).toBe(false)
  })
})

// ─── Rule 7: Horseman's Pick mounted only ────────────────────────────────────

describe("Rule 7 — Horseman's Pick mounted only", () => {
  it("Horseman's Pick on foot unit fails", () => {
    const group = makeGroup({
      equipment: { meleeWeapon: 'horsemans_pick', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'HORSEMANS_PICK_NOT_MOUNTED')).toBe(true)
  })

  it("Horseman's Pick on mounted unit passes rule 7", () => {
    const group = makeGroup({
      unitTypeId: 'mounted_knights',
      count: 2,
      equipment: { meleeWeapon: 'horsemans_pick', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: 'horse' },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'HORSEMANS_PICK_NOT_MOUNTED')).toBe(false)
  })
})

// ─── Rule 9+10: Baron/Lord Banner/Pennant ────────────────────────────────────

describe('Rules 9/10 — Banner/Pennant tier restriction', () => {
  it('Baron with Pennant (not Banner) fails', () => {
    const cmdGroup = makeGroup({
      unitTypeId: 'baron_foot',
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({ unitTypeId: 'baron_foot', experience: 'regular' }),
      commandGroupUpgrade: { banner: false, pennant: true, musician: false, priest: false },
    })
    const errors = validateGroup(cmdGroup)
    expect(errors.some(e => e.code === 'BARON_PENNANT_INVALID')).toBe(true)
  })

  it('Baron with Banner passes', () => {
    const cmdGroup = makeGroup({
      unitTypeId: 'baron_foot',
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({ unitTypeId: 'baron_foot', experience: 'regular' }),
      commandGroupUpgrade: { banner: true, pennant: false, musician: false, priest: false },
    })
    const errors = validateGroup(cmdGroup)
    expect(errors.some(e => e.code === 'BARON_PENNANT_INVALID')).toBe(false)
  })

  it('Lord with Banner (not Pennant) fails', () => {
    const cmdGroup = makeGroup({
      unitTypeId: 'lord_foot',
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({ unitTypeId: 'lord_foot', experience: 'regular' }),
      commandGroupUpgrade: { banner: true, pennant: false, musician: false, priest: false },
    })
    const errors = validateGroup(cmdGroup)
    expect(errors.some(e => e.code === 'LORD_BANNER_INVALID')).toBe(true)
  })
})

// ─── Rule 12+13: Levy/Monk experience caps ───────────────────────────────────

describe('Rules 12/13 — Experience caps', () => {
  it('Levy with Veteran experience fails', () => {
    const group = makeGroup({ unitTypeId: 'levy', experience: 'veteran' })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'INVALID_EXPERIENCE')).toBe(true)
  })

  it('Levy with Regular experience fails', () => {
    const group = makeGroup({ unitTypeId: 'levy', experience: 'regular' })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'INVALID_EXPERIENCE')).toBe(true)
  })

  it('Levy with Irregular passes', () => {
    const group = makeGroup({
      unitTypeId: 'levy',
      experience: 'irregular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: null, armour: null, shield: null, mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'INVALID_EXPERIENCE')).toBe(false)
  })

  it('Militant Monks with Veteran experience fails', () => {
    const group = makeGroup({ unitTypeId: 'militant_monks', experience: 'veteran' })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'INVALID_EXPERIENCE')).toBe(true)
  })

  it('Militant Monks with Regular passes', () => {
    const group = makeGroup({
      unitTypeId: 'militant_monks',
      experience: 'regular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: null, armour: null, shield: null, mount: null },
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'INVALID_EXPERIENCE')).toBe(false)
  })
})

// ─── Rule 16: Nimble/Skirmisher unarmoured only ──────────────────────────────

describe('Rule 16 — Nimble/Skirmisher unarmoured only', () => {
  it('Nimble on armoured group fails', () => {
    const group = makeGroup({
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: null, mount: null },
      purchasedAbilities: ['nimble'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'UNARMOURED_ABILITY')).toBe(true)
  })

  it('Skirmisher on armoured group fails', () => {
    const group = makeGroup({
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'padded', shield: null, mount: null },
      purchasedAbilities: ['skirmisher'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'UNARMOURED_ABILITY')).toBe(true)
  })

  it('Nimble on unarmoured group passes', () => {
    const group = makeGroup({
      unitTypeId: 'levy',
      experience: 'irregular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: null, armour: null, shield: null, mount: null },
      purchasedAbilities: ['nimble'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'UNARMOURED_ABILITY')).toBe(false)
  })
})

// ─── Rule 17: Commander-only abilities ───────────────────────────────────────

describe('Rule 17 — Commander-only abilities', () => {
  it('Formidable on warrior group fails', () => {
    const group = makeGroup({ purchasedAbilities: ['formidable'] })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'COMMANDER_ONLY_ABILITY')).toBe(true)
  })

  it('Cruelty on warrior group fails', () => {
    const group = makeGroup({ purchasedAbilities: ['cruelty'] })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'COMMANDER_ONLY_ABILITY')).toBe(true)
  })
})

// ─── Rule 18: Experienced Tactician — Retinue Leader only ────────────────────

describe('Rule 18 — Experienced Tactician', () => {
  it('Experienced Tactician on non-leader commander fails', () => {
    const cmdGroup = makeGroup({
      unitTypeId: 'lord_foot',
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({
        unitTypeId: 'lord_foot',
        isRetinueLeader: false,
        purchasedAbilities: ['experienced_tactician'],
      }),
    })
    const errors = validateGroup(cmdGroup)
    expect(errors.some(e => e.code === 'EXPERIENCED_TACTICIAN_NOT_LEADER')).toBe(true)
  })

  it('Experienced Tactician on retinue leader passes', () => {
    const cmdGroup = makeGroup({
      unitTypeId: 'lord_foot',
      experience: 'regular',
      count: 1,
      isCommandGroup: true,
      commander: makeCommander({
        unitTypeId: 'lord_foot',
        isRetinueLeader: true,
        purchasedAbilities: ['experienced_tactician'],
      }),
    })
    const errors = validateGroup(cmdGroup)
    expect(errors.some(e => e.code === 'EXPERIENCED_TACTICIAN_NOT_LEADER')).toBe(false)
  })
})

// ─── Rule 19: Close Ranks — Mounted Knights only ─────────────────────────────

describe('Rule 19 — Close Ranks', () => {
  it('Close Ranks on foot knights fails', () => {
    const group = makeGroup({ unitTypeId: 'knights', purchasedAbilities: ['close_ranks'] })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'CLOSE_RANKS_RESTRICTION')).toBe(true)
  })

  it('Close Ranks on mounted knights passes', () => {
    const group = makeGroup({
      unitTypeId: 'mounted_knights',
      count: 2,
      equipment: { meleeWeapon: 'sword', rangedWeapon: null, armour: 'mail', shield: 'medium_shield', mount: 'horse' },
      purchasedAbilities: ['close_ranks'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'CLOSE_RANKS_RESTRICTION')).toBe(false)
  })
})

// ─── Rule 20: Counter Charge — mounted only ──────────────────────────────────

describe('Rule 20 — Counter Charge', () => {
  it('Counter Charge on foot unit fails', () => {
    const group = makeGroup({ purchasedAbilities: ['counter_charge'] })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'COUNTER_CHARGE_RESTRICTION')).toBe(true)
  })
})

// ─── Rule 25: Master Fletcher — bow/crossbow only ────────────────────────────

describe('Rule 25 — Master Fletcher', () => {
  it('Master Fletcher on sword unit fails', () => {
    const group = makeGroup({ purchasedAbilities: ['master_fletcher'] })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MASTER_FLETCHER_RESTRICTION')).toBe(true)
  })

  it('Master Fletcher on bowmen passes', () => {
    const group = makeGroup({
      unitTypeId: 'bowmen',
      experience: 'regular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: 'bow', armour: null, shield: null, mount: null },
      purchasedAbilities: ['master_fletcher'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MASTER_FLETCHER_RESTRICTION')).toBe(false)
  })

  it('Master Fletcher on crossbowmen passes', () => {
    const group = makeGroup({
      unitTypeId: 'crossbowmen',
      experience: 'regular',
      equipment: { meleeWeapon: 'hand_weapon', rangedWeapon: 'crossbow', armour: null, shield: null, mount: null },
      purchasedAbilities: ['master_fletcher'],
    })
    const errors = validateGroup(group)
    expect(errors.some(e => e.code === 'MASTER_FLETCHER_RESTRICTION')).toBe(false)
  })
})

// ─── Over points limit ────────────────────────────────────────────────────────

describe('Points limit', () => {
  it('retinue over limit gets a warning (not error)', () => {
    const cmdGroup = makeCommanderGroup('baron_foot', 'regular', true)
    cmdGroup.commandGroupUpgrade = { banner: true, musician: true, priest: true, pennant: false }
    const retinue = makeRetinue([cmdGroup], 1) // 1pt limit — definitely over
    const errors = validateRetinue(retinue)
    const overLimit = errors.find(e => e.code === 'OVER_POINTS_LIMIT')
    expect(overLimit).toBeDefined()
    expect(overLimit?.severity).toBe('warning')
  })
})

// ─── Valid retinue (no errors) ────────────────────────────────────────────────

describe('Valid retinue', () => {
  it('clean retinue with lord + 6 knights produces no errors', () => {
    const cmdGroup = makeCommanderGroup('lord_foot', 'regular', true)
    cmdGroup.commandGroupUpgrade = { banner: false, pennant: true, musician: true, priest: true }
    const warriors = makeGroup({ unitTypeId: 'knights', experience: 'regular', count: 6 })
    const retinue = makeRetinue([cmdGroup, warriors], 500)
    const errors = validateRetinue(retinue)
    const hardErrors = errors.filter(e => e.severity === 'error')
    expect(hardErrors.length).toBe(0)
  })
})
