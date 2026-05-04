import { NextRequest, NextResponse } from 'next/server'
import { shortLinkStore, generateShortCode } from '@/src/store/shortLinkStore'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    // Return existing code for same URL
    for (const [code, stored] of shortLinkStore.entries()) {
      if (stored === url) return NextResponse.json({ code })
    }

    let code = generateShortCode()
    while (shortLinkStore.has(code)) code = generateShortCode()
    shortLinkStore.set(code, url)

    return NextResponse.json({ code })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
