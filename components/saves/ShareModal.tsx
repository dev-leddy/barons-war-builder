'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRetinueStore } from '@/src/store/retinueStore'
import { buildShareUrl } from '@/src/logic/share'
import { Copy, Check, Link, Image } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function ShareModal({ open, onClose }: Props) {
  const retinue = useRetinueStore(s => s.retinue)
  const [copied, setCopied] = useState<string | null>(null)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [loadingShort, setLoadingShort] = useState(false)

  const longUrl = typeof window !== 'undefined' ? buildShareUrl(retinue) : ''

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getShortLink = async () => {
    setLoadingShort(true)
    try {
      const res = await fetch('/api/s', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl }),
      })
      const data = await res.json()
      if (data.code) {
        const short = `${window.location.origin}/s/${data.code}`
        setShortUrl(short)
        copyToClipboard(short, 'short')
      }
    } catch {
      alert('Failed to create short link.')
    } finally {
      setLoadingShort(false)
    }
  }

  const copyDiscordImage = async () => {
    // Find the element to capture (mounted in builder page with id="retinue-summary-card")
    const el = document.getElementById('retinue-summary-card')
    if (!el) {
      alert('Summary card not found on page.')
      return
    }
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, { backgroundColor: '#1a1f2e', scale: 2 })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setCopied('image')
        setTimeout(() => setCopied(null), 2000)
      })
    } catch {
      alert('Failed to copy image. Your browser may not support this.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Retinue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Long URL */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Share Link
            </p>
            <div className="flex gap-2">
              <Input
                value={longUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => copyToClipboard(longUrl, 'long')}
              >
                {copied === 'long' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'long' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Short link */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Short Link
            </p>
            {shortUrl ? (
              <div className="flex gap-2">
                <Input value={shortUrl} readOnly className="text-xs font-mono" />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => copyToClipboard(shortUrl, 'short')}
                >
                  {copied === 'short' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'short' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={getShortLink}
                disabled={loadingShort}
              >
                <Link className="h-4 w-4" />
                {loadingShort ? 'Creating…' : 'Create Short Link'}
              </Button>
            )}
          </div>

          {/* Discord image */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Discord Image
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={copyDiscordImage}
            >
              {copied === 'image' ? (
                <><Check className="h-4 w-4" /> Copied to clipboard!</>
              ) : (
                <><Image className="h-4 w-4" /> Copy as Image</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Copies the retinue summary as a PNG for pasting into Discord.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
