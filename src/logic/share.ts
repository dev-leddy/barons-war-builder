import type { Retinue } from '@/src/types'

/** Encode a retinue to a base64 string for URL hash sharing. */
export function encodeRetinue(retinue: Retinue): string {
  const json = JSON.stringify(retinue)
  // btoa works on ASCII; use TextEncoder for full Unicode safety
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json).toString('base64')
  }
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ))
}

/** Decode a base64 URL hash back to a retinue (returns null on failure). */
export function decodeRetinue(encoded: string): Retinue | null {
  try {
    let json: string
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(encoded, 'base64').toString('utf-8')
    } else {
      json = decodeURIComponent(
        atob(encoded).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      )
    }
    const parsed = JSON.parse(json)
    // Basic shape check
    if (!parsed.id || !parsed.groups || !Array.isArray(parsed.groups)) return null
    return parsed as Retinue
  } catch {
    return null
  }
}

/** Build a shareable URL for the current page with retinue encoded as hash. */
export function buildShareUrl(retinue: Retinue): string {
  if (typeof window === 'undefined') return ''
  const encoded = encodeRetinue(retinue)
  const base = `${window.location.origin}/builder`
  return `${base}#${encoded}`
}

/** Read and decode a retinue from the current window hash, then clean the URL. */
export function consumeHashRetinue(): Retinue | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.slice(1) // strip leading '#'
  if (!hash) return null

  const retinue = decodeRetinue(hash)
  if (retinue) {
    // Clean the URL without triggering a navigation
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return retinue
}
