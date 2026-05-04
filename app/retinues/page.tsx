'use client'

import { LoadModal } from '@/components/saves/LoadModal'
import { useUIStore } from '@/src/store/uiStore'
import { FolderOpen } from 'lucide-react'

export default function RetinuesPage() {
  const openPanel = useUIStore(s => s.openPanel)
  const closePanel = useUIStore(s => s.closePanel)
  const activePanel = useUIStore(s => s.activePanel)

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-center px-6">
      <FolderOpen className="h-12 w-12 text-muted-foreground/30" />

      <div>
        <h1 className="font-heading text-2xl font-semibold">My Retinues</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Your saved retinues are stored locally in your browser.
        </p>
      </div>

      <button
        onClick={() => openPanel('load')}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Open Saved Retinues
      </button>

      <LoadModal open={activePanel === 'load'} onClose={closePanel} />
    </div>
  )
}
