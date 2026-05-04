'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Commander, Group, CommandGroupUpgrade, GroupEquipment, MeleeWeaponId, ShieldId, MountId } from '@/src/types'
import { DRAMATIS_PERSONAE, DP_ABILITIES, dpAbilityById } from '@/src/data/dramatisPersonae'
import { weaponById, shieldById, mountById } from '@/src/data/equipment'
import { useRetinueStore } from '@/src/store/retinueStore'
import { useUIStore } from '@/src/store/uiStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { DramatisPersonaeProfile } from '@/src/types'

type ConfigState = {
  dpId: string
  meleWeapon: MeleeWeaponId
  shield: ShieldId | null
  mount: MountId | null
  cgMusician: boolean
  cgPriest: boolean
}

function defaultConfig(dp: DramatisPersonaeProfile): ConfigState {
  return {
    dpId: dp.id,
    meleWeapon: dp.equipment.meleeWeapon as MeleeWeaponId,
    shield: dp.equipment.shield as ShieldId | null,
    mount: dp.equipment.mount as MountId | null,
    cgMusician: false,
    cgPriest: false,
  }
}

function computeDPCost(dp: DramatisPersonaeProfile, cfg: ConfigState): number {
  let cost = dp.pointsCost
  if (cfg.meleWeapon) cost += weaponById[cfg.meleWeapon]?.cost ?? 0
  if (cfg.shield) cost += shieldById[cfg.shield]?.cost ?? 0
  if (cfg.mount) cost += mountById[cfg.mount]?.cost ?? 0
  if (cfg.cgMusician) cost += 4
  if (cfg.cgPriest) cost += 4
  // Banner is always included for Barons (base cost includes the banner already in DP)
  // For simplicity, the pointsCost is the base — equipment is separate
  return cost
}

export function DramatisPersonaeBrowser() {
  const closePanel = useUIStore(s => s.closePanel)
  const addGroup = useRetinueStore(s => s.addGroup)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cfg, setCfg] = useState<ConfigState | null>(null)

  const selectedDP = selectedId ? DRAMATIS_PERSONAE.find(dp => dp.id === selectedId) : null

  function selectDP(dp: DramatisPersonaeProfile) {
    setSelectedId(dp.id)
    setCfg(defaultConfig(dp))
  }

  function handleAddToRetinue() {
    if (!selectedDP || !cfg) return

    const equipment: GroupEquipment = {
      meleeWeapon: cfg.meleWeapon,
      rangedWeapon: null,
      armour: 'mail',
      shield: cfg.shield,
      mount: cfg.mount,
    }

    const hasLance = false // DP characters don't use the lance option

    const commanderObj: Commander = {
      id: uuid(),
      name: selectedDP.name,
      unitTypeId: selectedDP.unitTypeId,
      experience: selectedDP.experience,
      equipment,
      purchasedAbilities: selectedDP.purchasedAbilities,
      isRetinueLeader: false,
      isKnightCommander: false,
      knightCommanderData: null,
      isDramatisPersonae: true,
      dramatisPersonaeId: selectedDP.id,
    }

    const canHaveBanner = selectedDP.commandGroupUpgrades.includes('banner')
    const canHavePriest = selectedDP.commandGroupUpgrades.includes('priest')

    const cgUpgrade: CommandGroupUpgrade = {
      banner: canHaveBanner,  // always include banner if available
      pennant: false,
      musician: cfg.cgMusician,
      priest: canHavePriest && cfg.cgPriest,
    }

    const group: Group = {
      id: uuid(),
      unitTypeId: selectedDP.unitTypeId,
      experience: selectedDP.experience,
      count: 1,
      isCommandGroup: true,
      commandGroupUpgrade: cgUpgrade,
      equipment,
      purchasedAbilities: selectedDP.purchasedAbilities,
      commander: commanderObj,
      commanderGroupId: null,
    }

    addGroup(group)
    setSelectedId(null)
    setCfg(null)
    closePanel()
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-card border-l border-border shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="font-semibold text-base leading-none">Dramatis Personae</h2>
          <p className="text-xs text-muted-foreground mt-0.5">PDF pp.131–137 · Named historical characters</p>
        </div>
        <button onClick={() => { setSelectedId(null); setCfg(null); closePanel() }} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!selectedDP ? (
          // Character list
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Named characters with fixed stats and unique abilities. Only one of each per game; both players must agree.
            </p>
            {DRAMATIS_PERSONAE.map(dp => (
              <button
                key={dp.id}
                onClick={() => selectDP(dp)}
                className="w-full rounded-lg border border-border hover:border-primary/50 bg-card p-3 text-left transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{dp.name}</p>
                    <p className="text-xs text-muted-foreground italic">{dp.title}</p>
                  </div>
                  <span className="text-base font-bold text-primary shrink-0 ml-2">{dp.pointsCost}+ pts</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dp.lore}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
                    {dp.stats.attack} Att
                  </Badge>
                  <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
                    {dp.stats.defence} Def
                  </Badge>
                  <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
                    {dp.stats.morale} Mor
                  </Badge>
                  <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
                    {dp.stats.actions} Act
                  </Badge>
                  <Badge variant="outline" className="text-xs h-4 px-1.5 py-0 capitalize">
                    {dp.experience}
                  </Badge>
                </div>
                {(dp.specialRules?.length ?? 0) > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {dp.specialRules!.map((rule, i) => (
                      <p key={i} className="text-xs text-yellow-500">⚠ {rule}</p>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          // Character configuration
          <div className="p-4 space-y-5">
            <button
              onClick={() => { setSelectedId(null); setCfg(null) }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← Back to characters
            </button>

            {/* Character header */}
            <div>
              <h3 className="font-semibold text-lg">{selectedDP.name}</h3>
              <p className="text-sm text-muted-foreground italic">{selectedDP.title}</p>
              <p className="text-xs text-muted-foreground mt-2">{selectedDP.lore}</p>
            </div>

            {/* Stats */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Stats ({selectedDP.experience})</h4>
              <div className="grid grid-cols-5 gap-1 text-center">
                {(['move', 'attack', 'defence', 'morale', 'actions'] as const).map(stat => (
                  <div key={stat} className="rounded-md bg-muted/30 p-1.5">
                    <p className="text-xs text-muted-foreground capitalize">{stat.slice(0, 3)}</p>
                    <p className="text-sm font-bold">
                      {stat === 'move' ? `${selectedDP.stats.move}"` : selectedDP.stats[stat]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Special abilities */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Special Abilities</h4>
              <div className="space-y-1.5">
                {selectedDP.inherentAbilities.map(abilId => {
                  const dpAbil = dpAbilityById[abilId]
                  const name = dpAbil?.name ?? abilId.replace(/_/g, ' ')
                  const desc = dpAbil?.description ?? ''
                  return (
                    <Tooltip key={abilId}>
                      <TooltipTrigger className="w-full text-left rounded-md bg-muted/20 border border-border/50 px-3 py-1.5 text-sm">
                        <span className="font-medium">{name}</span>
                        {dpAbil?.cost && dpAbil.cost > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">({dpAbil.cost}pts)</span>
                        )}
                      </TooltipTrigger>
                      {desc && (
                        <TooltipContent className="max-w-xs text-xs" side="left">
                          {desc}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            </div>

            {/* Special rules */}
            {(selectedDP.specialRules?.length ?? 0) > 0 && (
              <div className="space-y-1">
                {selectedDP.specialRules!.map((rule, i) => (
                  <p key={i} className="text-xs text-yellow-500">⚠ {rule}</p>
                ))}
              </div>
            )}

            {/* Equipment options */}
            {cfg && (
              <>
                {/* Melee weapon */}
                {(selectedDP.equipmentOptions?.meleeWeapons?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Melee Weapon</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {selectedDP.equipmentOptions!.meleeWeapons!.map(wId => {
                        const wData = weaponById[wId as string]
                        if (!wData) return null
                        return (
                          <button
                            key={wId}
                            onClick={() => setCfg(prev => prev ? { ...prev, meleWeapon: wId as MeleeWeaponId } : prev)}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                              cfg.meleWeapon === wId
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border hover:border-primary/50 text-muted-foreground'
                            )}
                          >
                            <span className="font-medium">{wData.name}</span>
                            <span className="ml-1">+{wData.cost}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Shield */}
                {(selectedDP.equipmentOptions?.shields?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Shield</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setCfg(prev => prev ? { ...prev, shield: null } : prev)}
                        className={cn(
                          'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                          cfg.shield === null
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        )}
                      >None</button>
                      {selectedDP.equipmentOptions!.shields!.map(sId => {
                        const sData = shieldById[sId as string]
                        if (!sData) return null
                        return (
                          <button
                            key={sId}
                            onClick={() => setCfg(prev => prev ? { ...prev, shield: sId as ShieldId } : prev)}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                              cfg.shield === sId
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border hover:border-primary/50 text-muted-foreground'
                            )}
                          >
                            <span className="font-medium">{sData.name}</span>
                            <span className="ml-1">+{sData.cost}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Mount */}
                {(selectedDP.equipmentOptions?.mounts?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Mount</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setCfg(prev => prev ? { ...prev, mount: null } : prev)}
                        className={cn(
                          'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                          cfg.mount === null
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        )}
                      >Dismounted</button>
                      {selectedDP.equipmentOptions!.mounts!.map(mId => {
                        const mData = mountById[mId as string]
                        if (!mData) return null
                        return (
                          <button
                            key={mId}
                            onClick={() => setCfg(prev => prev ? { ...prev, mount: mId as MountId } : prev)}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-xs text-left transition-all',
                              cfg.mount === mId
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border hover:border-primary/50 text-muted-foreground'
                            )}
                          >
                            <span className="font-medium">{mData.name}</span>
                            <span className="ml-1">+{mData.cost}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* CG Upgrades */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Command Group Upgrades</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {selectedDP.commandGroupUpgrades.includes('banner') && (
                      <div className="rounded-md border border-primary/30 px-3 py-1.5 text-xs text-muted-foreground bg-primary/5">
                        <span className="font-medium">Banner</span>
                        <span className="ml-1">+9pts (included)</span>
                      </div>
                    )}
                    {selectedDP.commandGroupUpgrades.includes('musician') && (
                      <button
                        onClick={() => setCfg(prev => prev ? { ...prev, cgMusician: !prev.cgMusician } : prev)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                          cfg.cgMusician
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        )}
                      >
                        <span className="font-medium">Musician</span>
                        <span className="ml-1">+4pts</span>
                      </button>
                    )}
                    {selectedDP.commandGroupUpgrades.includes('priest') && (
                      <button
                        onClick={() => setCfg(prev => prev ? { ...prev, cgPriest: !prev.cgPriest } : prev)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs text-left transition-all',
                          cfg.cgPriest
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50 text-muted-foreground'
                        )}
                      >
                        <span className="font-medium">Priest</span>
                        <span className="ml-1">+4pts</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedDP && cfg && (
        <div className="border-t border-border p-4 shrink-0 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">{selectedDP.name}</span>
            <span className="text-xl font-bold text-primary">{computeDPCost(selectedDP, cfg)} pts</span>
          </div>
          <Button className="w-full" size="sm" onClick={handleAddToRetinue}>
            Add to Retinue
          </Button>
        </div>
      )}
    </div>
  )
}
