'use client'

import type { UnitType, Experience, Commander, GroupEquipment } from '@/src/types'
import { EquipmentSection } from './EquipmentSection'
import { unitTypeById } from '@/src/data/unitTypes'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  unitType: UnitType
  experience: Experience
  commander: Commander
  onChange: (commander: Commander) => void
}

const UPGRADE_LABELS: Record<string, { label: string; cost: number }> = {
  banner:   { label: 'Bannerman', cost: 9 },
  pennant:  { label: 'Pennant Bearer', cost: 7 },
  musician: { label: 'Musician', cost: 4 },
  priest:   { label: 'Priest', cost: 4 },
}

export function CommandGroupSection({ unitType, experience, commander, onChange }: Props) {
  const availableUpgrades = unitType.commandGroupUpgrades

  const setEquipment = (equipment: GroupEquipment) =>
    onChange({ ...commander, equipment })

  const toggleUpgrade = (key: string) => {
    // Commander upgrades are stored on the Group, not the Commander sub-object.
    // This component emits to the parent which updates group.commandGroupUpgrade.
    // We call back through onChange with a custom key on commander to carry the signal.
    // The AddGroupSheet will intercept this.
    onChange({ ...commander, _cgUpgradeToggle: key } as Commander & { _cgUpgradeToggle: string })
  }

  const setName = (name: string) => onChange({ ...commander, name })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Commander Name
        </Label>
        <Input
          value={commander.name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sir Richard de Clare"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Commander Equipment
        </p>
        <EquipmentSection
          unitType={unitType}
          experience={experience}
          equipment={commander.equipment}
          onChange={setEquipment}
        />
      </div>

      {availableUpgrades.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Command Group Upgrades
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {availableUpgrades.map(key => {
              const info = UPGRADE_LABELS[key]
              if (!info) return null
              return (
                <UpgradeButton
                  key={key}
                  label={info.label}
                  cost={info.cost}
                  onToggle={() => toggleUpgrade(key)}
                />
              )
            })}
          </div>
          <CmdGroupFromInfo unitType={unitType} />
        </div>
      )}
    </div>
  )
}

function UpgradeButton({
  label,
  cost,
  onToggle,
}: {
  label: string
  cost: number
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="text-left px-2.5 py-2 rounded-md border border-border hover:border-primary/50 text-sm transition-all"
    >
      <span className="block text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">+{cost} pts</span>
    </button>
  )
}

function CmdGroupFromInfo({ unitType }: { unitType: UnitType }) {
  if (unitType.commandGroupFrom.length === 0) return null
  const names = unitType.commandGroupFrom.map(id =>
    unitTypeById[id]?.name ?? id
  )
  return (
    <p className="text-xs text-muted-foreground">
      Command Group must be made from: <span className="text-foreground">{names.join(' or ')}</span>
    </p>
  )
}
