export type FactionId = 'feudal_european'

export interface FactionDef {
  id: FactionId
  name: string
  description: string
}

export const FACTIONS: FactionDef[] = [
  {
    id: 'feudal_european',
    name: 'Feudal European',
    description: 'England & France, 13th century',
  },
]

export const factionById = Object.fromEntries(
  FACTIONS.map(f => [f.id, f])
) as Record<FactionId, FactionDef>
