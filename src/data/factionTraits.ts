import type { FactionTrait } from '@/src/types'

// PDF p.113 / printed p.112 — Barons' War: Feudal European Faction Traits
// These are always active; no cost and no purchase needed.

export const FACTION_TRAITS: FactionTrait[] = [
  {
    id: 'cavalry_warfare_first_charge',
    name: 'Cavalry Warfare: First Charge',
    description:
      'The first time mounted Knights in this retinue make a Charge action each game, they automatically gain the Close Ranks ability (if not Weary and the charge distance is at least 6").',
  },
  {
    id: 'infantry_screen',
    name: 'Infantry Screen',
    description:
      'Mounted Knights in this retinue may draw Line of Sight through one friendly infantry group when making a Charge. That infantry group must pass an Order check or suffers casualties.',
  },
]
