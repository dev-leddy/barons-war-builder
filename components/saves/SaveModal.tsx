'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSavesStore } from '@/src/store/savesStore'
import { useRetinueStore } from '@/src/store/retinueStore'
import type { SaveCategory } from '@/src/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function SaveModal({ open, onClose }: Props) {
  const retinue = useRetinueStore(s => s.retinue)
  const { saves, save } = useSavesStore()
  const [name, setName] = useState(retinue.name)
  const [category, setCategory] = useState<SaveCategory>('Standard')
  const [overwriteId, setOverwriteId] = useState<string | null>(null)

  const handleSave = () => {
    const ok = save(retinue, name || retinue.name, category, overwriteId ?? undefined)
    if (ok) onClose()
    else alert('No save slots available (max 10).')
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Retinue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={retinue.name} />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex gap-2">
              {(['Standard', 'Campaign'] as SaveCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex-1 py-2 rounded-md border text-sm font-medium transition-all',
                    category === cat
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {saves.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Overwrite existing slot (optional)</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => setOverwriteId(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-md border text-xs transition-all',
                    !overwriteId
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  New save slot ({saves.length}/10 used)
                </button>
                {saves.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setOverwriteId(slot.id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md border text-xs transition-all',
                      overwriteId === slot.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className="font-medium">{slot.name}</span>
                    <span className="text-muted-foreground ml-2">{slot.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
