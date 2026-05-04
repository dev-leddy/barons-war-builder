'use client'

import { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { UnitTypePicker, RoleFilter } from './UnitTypePicker'
import { ExperienceSelector } from './ExperienceSelector'
import { CountStepper } from './CountStepper'
import { EquipmentSection } from './EquipmentSection'
import { AbilitiesSection } from './AbilitiesSection'
import { CommandGroupSection } from './CommandGroupSection'
import { CostSummary } from './CostSummary'
import type { Group, Commander, Experience, GroupEquipment } from '@/src/types'
import { unitTypeById } from '@/src/data/unitTypes'
import { defaultEquipment } from '@/src/logic/equipment'
import { useRetinueStore } from '@/src/store/retinueStore'
import { useUIStore } from '@/src/store/uiStore'
import { Separator } from '@/components/ui/separator'

function makeDefaultCommander(unitTypeId: string, experience: Experience): Commander {
  const ut = unitTypeById[unitTypeId]!
  return {
    id: uuid(),
    name: '',
    unitTypeId,
    experience,
    equipment: defaultEquipment(ut, experience),
    purchasedAbilities: [],
    isRetinueLeader: false,
    isKnightCommander: false,
    knightCommanderData: null,
    isDramatisPersonae: false,
    dramatisPersonaeId: null,
  }
}

function makeDefaultGroup(unitTypeId: string): Group {
  const ut = unitTypeById[unitTypeId]!
  const experience: Experience = ut.experienceOptions.includes('regular') ? 'regular' : ut.experienceOptions[0]
  const minSize = ut.minGroupSize ?? (ut.isMounted ? 2 : 4)
  const count = ut.isCommander ? 1 : minSize

  return {
    id: uuid(),
    unitTypeId,
    experience,
    count,
    isCommandGroup: ut.isCommander,
    commandGroupUpgrade: { banner: false, pennant: false, musician: false, priest: false },
    equipment: defaultEquipment(ut, experience),
    purchasedAbilities: [],
    commander: ut.isCommander ? makeDefaultCommander(unitTypeId, experience) : null,
    commanderGroupId: null,
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function AddGroupSheet({ open, onClose }: Props) {
  const editingGroupId = useUIStore(s => s.editingGroupId)
  const retinue = useRetinueStore(s => s.retinue)
  const addGroup = useRetinueStore(s => s.addGroup)
  const updateGroup = useRetinueStore(s => s.updateGroup)

  const existingGroup = editingGroupId
    ? retinue.groups.find(g => g.id === editingGroupId) ?? null
    : null

  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(existingGroup?.unitTypeId ?? null)
  const [group, setGroup] = useState<Group | null>(existingGroup ?? null)

  // Reset when sheet opens/closes or editing target changes
  useEffect(() => {
    if (open) {
      if (existingGroup) {
        setSelectedTypeId(existingGroup.unitTypeId)
        setGroup(existingGroup)
      } else {
        setSelectedTypeId(null)
        setGroup(null)
        setRoleFilter('all')
      }
    }
  }, [open, editingGroupId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectType = (id: string) => {
    setSelectedTypeId(id)
    setGroup(makeDefaultGroup(id))
  }

  const handleExperienceChange = (exp: Experience) => {
    if (!group) return
    const ut = unitTypeById[group.unitTypeId]!
    setGroup({
      ...group,
      experience: exp,
      equipment: defaultEquipment(ut, exp),
      commander: group.commander ? makeDefaultCommander(group.unitTypeId, exp) : null,
    })
  }

  const handleCommanderChange = (commander: Commander & { _cgUpgradeToggle?: string }) => {
    if (!group) return
    const { _cgUpgradeToggle, ...cleanCommander } = commander as Commander & { _cgUpgradeToggle?: string }
    if (_cgUpgradeToggle) {
      const key = _cgUpgradeToggle as keyof typeof group.commandGroupUpgrade
      setGroup({
        ...group,
        commander: cleanCommander,
        commandGroupUpgrade: {
          ...group.commandGroupUpgrade,
          [key]: !group.commandGroupUpgrade[key],
        },
      })
    } else {
      setGroup({ ...group, commander: cleanCommander })
    }
  }

  const handleSave = () => {
    if (!group) return
    if (existingGroup) {
      updateGroup(existingGroup.id, group)
    } else {
      addGroup(group)
    }
    onClose()
  }

  const unitType = group ? unitTypeById[group.unitTypeId] : null
  const minSize = unitType
    ? (unitType.minGroupSize ?? (unitType.isMounted ? 2 : 4))
    : 4

  const hasArmour = !!(group?.equipment?.armour)
  const hasBowOrCrossbow = group?.equipment?.rangedWeapon === 'bow' || group?.equipment?.rangedWeapon === 'crossbow'

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="font-heading text-lg">
            {existingGroup ? 'Edit Group' : 'Add Group'}
          </SheetTitle>
          {/* Role filter shown before type selection */}
          {!group && (
            <RoleFilter active={roleFilter} onChange={setRoleFilter} />
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Step 1: pick unit type */}
          {!group ? (
            <UnitTypePicker
              selected={selectedTypeId}
              onSelect={handleSelectType}
              filter={roleFilter}
            />
          ) : (
            <>
              {/* Show selected type with back button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setGroup(null); setSelectedTypeId(null) }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  ← Change type
                </button>
                <span className="text-sm font-semibold">{unitType?.name}</span>
              </div>

              <Separator />

              {/* Experience */}
              <ExperienceSelector
                unitType={unitType!}
                selected={group.experience}
                onChange={handleExperienceChange}
              />

              {/* Count (warriors only) */}
              {!unitType?.isCommander && (
                <CountStepper
                  value={group.count}
                  min={minSize}
                  onChange={count => setGroup({ ...group, count })}
                />
              )}

              <Separator />

              {/* Equipment (warrior group) */}
              {!unitType?.isCommander && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipment (per warrior)</p>
                  <EquipmentSection
                    unitType={unitType!}
                    experience={group.experience}
                    equipment={group.equipment}
                    onChange={equipment => setGroup({ ...group, equipment })}
                  />
                </div>
              )}

              {/* Command Group section (commanders) */}
              {unitType?.isCommander && group.commander && (
                <CommandGroupSection
                  unitType={unitType}
                  experience={group.experience}
                  commander={group.commander}
                  onChange={handleCommanderChange}
                />
              )}

              <Separator />

              {/* Abilities */}
              <AbilitiesSection
                unitType={unitType!}
                experience={group.experience}
                isRetinueLeader={group.commander?.isRetinueLeader ?? false}
                hasArmour={hasArmour}
                hasBowOrCrossbow={hasBowOrCrossbow}
                selected={unitType?.isCommander ? (group.commander?.purchasedAbilities ?? []) : group.purchasedAbilities}
                onChange={(ids) => {
                  if (unitType?.isCommander && group.commander) {
                    setGroup({ ...group, commander: { ...group.commander, purchasedAbilities: ids } })
                  } else {
                    setGroup({ ...group, purchasedAbilities: ids })
                  }
                }}
              />

              <Separator />

              {/* Cost summary */}
              <CostSummary group={group} />
            </>
          )}
        </div>

        {group && (
          <div className="shrink-0 px-5 py-4 border-t border-border">
            <Button onClick={handleSave} className="w-full">
              {existingGroup ? 'Save Changes' : 'Add to Retinue'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
