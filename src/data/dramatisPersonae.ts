import type { DramatisPersonaeProfile } from '@/src/types'

// PDF pp.132–138 / printed pp.131–137
// Each character joins a Group as a Command Group (like any Commander).
// Only one of each per game; both players must agree to field them.
// They cannot gain extra Abilities beyond those listed in their profile.
// You may modify their equipment as set out in their profile options.

export const DRAMATIS_PERSONAE: DramatisPersonaeProfile[] = [
  // ── King John of England ─────────────────────────────────────────────────
  // PDF pp.132–133 / printed pp.131–132
  {
    id: 'king_john',
    name: 'King John',
    title: 'of England',
    lore:
      'The youngest son of Henry II and Eleanor of Aquitaine (1166–1216). Infamous for his costly wars on the Continent, his conflict with the barons, and the signing of Magna Carta. A capable commander in siege warfare, but his vindictive nature and poor leadership ultimately led to the First Barons\' War.',
    unitTypeId: 'baron_mounted',
    experience: 'regular',
    stats: { move: 6, attack: '5+', defence: '7+', morale: '4+', actions: 3 },
    equipment: {
      meleeWeapon: 'sword',
      rangedWeapon: null,
      armour: 'mail',
      shield: 'medium_shield',
      mount: null,
    },
    inherentAbilities: [
      'chivalry',
      'commander_ability',
      'kj_cruel_king',
      'kj_cunning_tactician',
      'kj_fear_of_treachery',
      'kj_to_the_king',
    ],
    purchasedAbilities: [],
    commandGroupFrom: ['knights', 'mounted_knights'],
    commandGroupUpgrades: ['banner', 'musician', 'priest'],
    pointsCost: 45,
    // If King John is chosen, he must be the Retinue Leader.
    equipmentOptions: {
      meleeWeapons: ['sword', 'mace', 'falchion'],
      mounts: ['horse', 'barded_horse'],
      shields: ['medium_shield', 'large_shield'],
      armour: ['mail'],
    },
    specialRules: [
      'Must be designated as Retinue Leader.',
    ],
  },

  // ── William Marshal, Earl of Pembroke ────────────────────────────────────
  // PDF pp.134–135 / printed pp.133–134
  {
    id: 'william_marshal',
    name: 'William Marshal',
    title: 'Earl of Pembroke and Regent of England',
    lore:
      'The "greatest knight that ever lived" (1147–1219). A loyal servant to five English kings, William Marshal fought for King John and later served as Regent for the young Henry III. He prosecuted the war against Prince Louis with remarkable energy, culminating in the battle of Lincoln in 1217.',
    unitTypeId: 'baron_mounted',
    experience: 'veteran',
    stats: { move: 6, attack: '4+', defence: '7+', morale: '2+', actions: 3 },
    equipment: {
      meleeWeapon: 'sword',
      rangedWeapon: null,
      armour: 'mail',
      shield: 'medium_shield',
      mount: null,
    },
    inherentAbilities: [
      'commander_ability',
      'chivalry',
      'wm_for_the_realm',
      'wm_justiciar',
      'wm_greatest_knight',
    ],
    purchasedAbilities: [],
    commandGroupFrom: ['knights', 'mounted_knights'],
    commandGroupUpgrades: ['banner', 'musician', 'priest'],
    pointsCost: 40,
    equipmentOptions: {
      meleeWeapons: ['sword', 'mace', 'falchion'],
      mounts: ['horse', 'barded_horse'],
      shields: ['medium_shield', 'large_shield'],
      armour: ['mail'],
    },
    specialRules: [],
  },

  // ── Prince Louis "the Lion" ───────────────────────────────────────────────
  // PDF pp.136–138 / printed pp.135–137
  {
    id: 'prince_louis',
    name: 'Prince Louis "the Lion"',
    title: 'Heir to the Throne of France',
    lore:
      'Louis (1187–1226), eldest son of Philip II of France, was invited by rebel English barons to take the English throne from King John. He led French forces into England in 1216 and was close to success before John\'s death and William Marshal\'s skilful diplomacy turned the tide against him.',
    unitTypeId: 'baron_mounted',
    experience: 'regular',
    stats: { move: 6, attack: '5+', defence: '7+', morale: '2+', actions: 3 },
    equipment: {
      meleeWeapon: 'sword',
      rangedWeapon: null,
      armour: 'mail',
      shield: 'medium_shield',
      mount: null,
    },
    inherentAbilities: [
      'commander_ability',
      'chivalry',
      'pl_excommunicate',
      'pl_for_the_lion',
      'pl_inspiring_presence',
      'pl_the_lion',
    ],
    purchasedAbilities: [],
    commandGroupFrom: ['knights', 'mounted_knights'],
    // Note: Louis' Command Group may NOT include a Priest (Excommunicate rule)
    commandGroupUpgrades: ['banner', 'musician'],
    pointsCost: 45,
    equipmentOptions: {
      meleeWeapons: ['sword', 'mace', 'falchion'],
      mounts: ['horse', 'barded_horse'],
      shields: ['medium_shield', 'large_shield'],
      armour: ['mail'],
    },
    specialRules: [
      'Must be designated as Retinue Leader.',
      'Command Group may not include a Priest (Excommunicate).',
    ],
  },
]

// ── Dramatis Personae Special Abilities ──────────────────────────────────────
// These abilities are unique to named characters; not available in the
// general ability pool.  Stored here for display and rule reference.

export interface DPAbility {
  id: string
  name: string
  cost: number
  description: string
  restriction: string
}

export const DP_ABILITIES: DPAbility[] = [
  // King John
  {
    id: 'kj_cruel_king',
    name: 'Cruel King',
    cost: 3,
    description:
      'Commander only (Retinue Leader). If a Group makes a Combat Action or Reaction thanks to a Command Action from the Cruel King, it gains an Attack die. If it makes a Defend Action or Reaction, it gains a Defence die. However, if the group fails a Morale Check to receive an Order from the Commander, they take an immediate casualty.',
    restriction: 'commander_only',
  },
  {
    id: 'kj_cunning_tactician',
    name: 'Cunning Tactician',
    cost: 4,
    description:
      'Commander only. Once per round the Commander may make a free Command Action. This is in addition to the Commander\'s normal Actions. It may be used to give an Action even if the Commander is not the Retinue Leader.',
    restriction: 'commander_only',
  },
  {
    id: 'kj_fear_of_treachery',
    name: 'Fear of Treachery',
    cost: 0,
    description:
      'Commander only. If King John\'s Command Group has more Morale Penalties than Warriors, King John may not declare Charges. He must activate in the Compulsory Action phase and use a Move Action to move as far away as possible from any enemy Groups.',
    restriction: 'commander_only',
  },
  {
    id: 'kj_to_the_king',
    name: 'To the King!',
    cost: 3,
    description:
      'Commander only. The Command Group gains +1 to its Defence rolls as long as the Commander is still alive.',
    restriction: 'commander_only',
  },
  // William Marshal
  {
    id: 'wm_for_the_realm',
    name: 'For the Realm',
    cost: 3,
    description:
      'Commander only. This Commander and his Command Group never become Weary. They may still only use two Actions (not counting Command Actions).',
    restriction: 'commander_only',
  },
  {
    id: 'wm_justiciar',
    name: 'Justiciar',
    cost: 3,
    description:
      'Commander only. May use a Command Action on the same Group twice during the same round. This could mean the Group takes three Actions rather than the normally-permitted two. The Group will become Weary as normal.',
    restriction: 'commander_only',
  },
  {
    id: 'wm_greatest_knight',
    name: 'The Greatest Knight',
    cost: 1,
    description:
      'Commander only. Groups within 6" automatically pass their Order check to take a Command Action from this Commander.',
    restriction: 'commander_only',
  },
  // Prince Louis
  {
    id: 'pl_excommunicate',
    name: 'Excommunicate',
    cost: 0,
    description:
      'Commander only. Louis was cut off from the body of the Church for taking up arms to claim the throne of a Papal vassal. If Prince Louis is chosen, his Command Group may not include a Priest.',
    restriction: 'commander_only',
  },
  {
    id: 'pl_for_the_lion',
    name: 'For the Lion!',
    cost: 1,
    description:
      'Commander only. If a Group Charges as a result of a Command Action from this Commander, they gain +1 to their Attack rolls.',
    restriction: 'commander_only',
  },
  {
    id: 'pl_inspiring_presence',
    name: 'Inspiring Presence',
    cost: 2,
    description:
      'Commander only. If this Commander and his Command Group win a Melee Combat, all friendly Groups within 6" reduce their Morale Penalties by 1 at the end of that Combat Action.',
    restriction: 'commander_only',
  },
  {
    id: 'pl_the_lion',
    name: 'The Lion',
    cost: 1,
    description:
      'Commander only. When determining the Strength of the Charge, the Command Group rolls an extra d6 and chooses the highest result.',
    restriction: 'commander_only',
  },
]

export const dramatisPersonaeById = Object.fromEntries(
  DRAMATIS_PERSONAE.map(dp => [dp.id, dp])
) as Record<string, DramatisPersonaeProfile>

export const dpAbilityById = Object.fromEntries(
  DP_ABILITIES.map(a => [a.id, a])
) as Record<string, DPAbility>
