import { NextRequest, NextResponse } from 'next/server'

// Shared store — in production use a database or KV
// For now, import the in-memory store via a module-level singleton
// The store from /api/s/route.ts is not accessible here in Edge/Node isolation,
// so we use a separate singleton module.
import { shortLinkStore } from '@/src/store/shortLinkStore'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const url = shortLinkStore.get(code)
  if (!url) {
    return new NextResponse('Not found', { status: 404 })
  }
  return NextResponse.redirect(url, 302)
}
