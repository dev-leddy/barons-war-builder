'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSavesStore } from '@/src/store/savesStore'
import { useRetinueStore } from '@/src/store/retinueStore'
import { Trash2, FolderOpen, FilePlus } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function LoadModal({ open, onClose }: Props) {
  const { saves, deleteSave, draft } = useSavesStore()
  const loadRetinue = useRetinueStore(s => s.loadRetinue)
  const resetRetinue = useRetinueStore(s => s.resetRetinue)

  const handleLoad = (retinue: Parameters<typeof loadRetinue>[0]) => {
    loadRetinue(retinue)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load Retinue</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
          {draft && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{draft.name}</p>
                  <p className="text-xs text-muted-foreground">Auto-saved draft</p>
                </div>
                <Button size="sm" onClick={() => handleLoad(draft)} className="gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Load
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">New Retinue</p>
                <p className="text-xs text-muted-foreground">Start fresh with an empty retinue</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => { resetRetinue(); onClose() }}
              >
                <FilePlus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </div>

          {saves.length === 0 && !draft && (
            <p className="text-sm text-muted-foreground text-center py-4">No saved retinues yet.</p>
          )}

          {saves.map(slot => (
            <div
              key={slot.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/40 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{slot.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">{slot.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(slot.updatedAt).toLocaleDateString()} · {slot.data.pointsLimit} pts limit
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => handleLoad(slot.data)} className="h-8 gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSave(slot.id)}
                  className="h-8 text-destructive/70 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
