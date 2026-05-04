'use client'

import { useEffect } from 'react'
import { GroupList } from '@/components/builder/GroupList'
import { RetinueSidebar } from '@/components/builder/RetinueSidebar'
import { SaveModal } from '@/components/saves/SaveModal'
import { LoadModal } from '@/components/saves/LoadModal'
import { ShareModal } from '@/components/saves/ShareModal'
import { KnightCommanderWizard } from '@/components/generator/KnightCommanderWizard'
import { RetinueSummaryCard } from '@/components/builder/RetinueSummaryCard'
import { DramatisPersonaeBrowser } from '@/components/dramatis/DramatisPersonaeBrowser'
import { useUIStore } from '@/src/store/uiStore'
import { useAutoDraft } from '@/src/hooks/useAutoDraft'
import { useShareHash } from '@/src/hooks/useShareHash'
import { useSavesStore } from '@/src/store/savesStore'
import { useRetinueStore } from '@/src/store/retinueStore'

export default function BuilderPage() {
  const activePanel = useUIStore(s => s.activePanel)
  const closePanel = useUIStore(s => s.closePanel)

  useAutoDraft()
  useShareHash()

  const draft = useSavesStore(s => s.draft)
  const loadRetinue = useRetinueStore(s => s.loadRetinue)
  const isDirty = useRetinueStore(s => s.isDirty)

  useEffect(() => {
    if (!isDirty && draft) {
      if (!window.location.hash) {
        loadRetinue(draft)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left sidebar */}
      <RetinueSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <GroupList />
      </main>

      {/* Modals */}
      <SaveModal open={activePanel === 'save'} onClose={closePanel} />
      <LoadModal open={activePanel === 'load'} onClose={closePanel} />
      <ShareModal open={activePanel === 'share'} onClose={closePanel} />
      {activePanel === 'knight_commander' && <KnightCommanderWizard />}
      <RetinueSummaryCard />
      {activePanel === 'dramatis_personae' && <DramatisPersonaeBrowser />}
    </div>
  )
}
