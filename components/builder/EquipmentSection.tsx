'use client'

import type { UnitType, Experience, GroupEquipment, MeleeWeaponId, RangedWeaponId, ArmourId, ShieldId, MountId } from '@/src/types'
import {
  getAvailableMeleeWeapons,
  getAvailableRangedWeapons,
  getAvailableArmour,
  getAvailableShields,
  getAvailableMounts,
} from '@/src/logic/equipment'
import { weaponById, armourById, shieldById, mountById } from '@/src/data/equipment'
import { cn } from '@/lib/utils'

interface Props {
  unitType: UnitType
  experience: Experience
  equipment: GroupEquipment
  onChange: (equipment: GroupEquipment) => void
}

export function EquipmentSection({ unitType, experience, equipment, onChange }: Props) {
  const meleeOptions = getAvailableMeleeWeapons(unitType, experience)
  const rangedOptions = getAvailableRangedWeapons(unitType)
  const armourOptions = getAvailableArmour(unitType, experience)
  const shieldOptions = getAvailableShields(unitType, equipment.meleeWeapon, equipment.rangedWeapon)
  const mountOptions = getAvailableMounts(unitType)

  const set = <K extends keyof GroupEquipment>(key: K, value: GroupEquipment[K]) =>
    onChange({ ...equipment, [key]: value })

  const clearShieldIfBlocked = (meleeId: MeleeWeaponId | null, rangedId: RangedWeaponId | null) => {
    const newShieldOptions = getAvailableShields(unitType, meleeId, rangedId)
    if (newShieldOptions.length === 0 && equipment.shield) {
      return null
    }
    return equipment.shield
  }

  return (
    <div className="space-y-4">
      {/* Melee weapons */}
      {meleeOptions.length > 0 && (
        <EquipSection
          label="Melee Weapon"
          required={unitType.meleeWeapons.required}
          options={meleeOptions.map(id => ({
            id,
            label: weaponById[id]?.name ?? id,
            cost: weaponById[id]?.cost ?? 0,
            note: weaponById[id]?.specialRules.slice(0, 1).join(', '),
          }))}
          selected={equipment.meleeWeapon}
          onSelect={(id) => {
            const mid = id as MeleeWeaponId
            const newShield = clearShieldIfBlocked(mid, equipment.rangedWeapon)
            onChange({ ...equipment, meleeWeapon: mid, shield: newShield })
          }}
        />
      )}

      {/* Ranged weapons */}
      {rangedOptions.length > 0 && (
        <EquipSection
          label="Ranged Weapon"
          required={unitType.rangedWeapons.required}
          options={rangedOptions.map(id => ({
            id,
            label: weaponById[id]?.name ?? id,
            cost: weaponById[id]?.cost ?? 0,
            note: weaponById[id]?.specialRules.slice(0, 1).join(', '),
          }))}
          selected={equipment.rangedWeapon}
          onSelect={(id) => {
            const rid = id as RangedWeaponId
            const newShield = clearShieldIfBlocked(equipment.meleeWeapon, rid)
            onChange({ ...equipment, rangedWeapon: rid, shield: newShield })
          }}
          optional
        />
      )}

      {/* Lance add-on for mounted units */}
      {unitType.isMounted && equipment.mount && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Lance (additional weapon)
          </label>
          <button
            onClick={() => {
              const hasLance = equipment.meleeWeapon === 'lance'
              onChange({
                ...equipment,
                meleeWeapon: hasLance ? 'sword' : 'lance' as MeleeWeaponId,
              })
            }}
            className={cn(
              'w-full text-left px-3 py-2 rounded-md border text-sm transition-all',
              equipment.meleeWeapon === 'lance'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            Lance +4 pts — PIERCING, SHOCK (single use on first charge)
          </button>
        </div>
      )}

      {/* Armour */}
      {armourOptions.length > 0 && (
        <EquipSection
          label="Armour"
          required={unitType.armour.required}
          options={armourOptions.map(id => ({
            id,
            label: armourById[id]?.name ?? id,
            cost: armourById[id]?.cost ?? 0,
            note: `Move ${armourById[id]?.moveModifier ?? 0}"`,
          }))}
          selected={equipment.armour}
          onSelect={(id) => set('armour', id as ArmourId)}
          optional={!unitType.armour.required}
        />
      )}

      {/* Shield */}
      {shieldOptions.length > 0 ? (
        <EquipSection
          label="Shield"
          required={false}
          options={shieldOptions.map(id => ({
            id,
            label: shieldById[id]?.name ?? id,
            cost: shieldById[id]?.cost ?? 0,
            note: `Roll: ${shieldById[id]?.shieldRoll}`,
          }))}
          selected={equipment.shield}
          onSelect={(id) => set('shield', id as ShieldId)}
          optional
        />
      ) : (
        // Shield explicitly blocked by TWO HANDED weapon
        unitType.shield.options.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            Shield unavailable — TWO HANDED weapon equipped.
          </p>
        )
      )}

      {/* Mount */}
      {mountOptions.length > 0 && (
        <EquipSection
          label="Mount"
          required={unitType.mount.required}
          options={mountOptions.map(id => ({
            id,
            label: mountById[id]?.name ?? id,
            cost: mountById[id]?.cost ?? 0,
            note: `+${mountById[id]?.moveBonus}"${mountById[id]?.defenceBonus ? `, +${mountById[id].defenceBonus} Def` : ''}`,
          }))}
          selected={equipment.mount}
          onSelect={(id) => set('mount', id as MountId)}
        />
      )}
    </div>
  )
}

interface EquipOption {
  id: string
  label: string
  cost: number
  note?: string
}

function EquipSection({
  label,
  required,
  options,
  selected,
  onSelect,
  optional = false,
}: {
  label: string
  required: boolean
  options: EquipOption[]
  selected: string | null | undefined
  onSelect: (id: string) => void
  optional?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        {required && <span className="text-xs text-destructive">*</span>}
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {optional && (
          <EquipButton
            id="none"
            label="None"
            cost={0}
            isSelected={!selected}
            onSelect={() => onSelect('none')}
          />
        )}
        {options.map(opt => (
          <EquipButton
            key={opt.id}
            {...opt}
            isSelected={selected === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  )
}

function EquipButton({
  id,
  label,
  cost,
  note,
  isSelected,
  onSelect,
}: EquipOption & { isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left px-3 py-2 rounded-md border text-sm transition-all',
        isSelected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border hover:border-primary/50 text-foreground'
      )}
    >
      <div className="flex justify-between gap-2">
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground shrink-0">
          {cost > 0 ? `+${cost}` : id === 'none' ? '' : '0'}
        </span>
      </div>
      {note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{note}</p>}
    </button>
  )
}
