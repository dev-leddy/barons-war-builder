// Singleton in-memory short link store (shared across API route handlers in the same process)
// Replace with a real database (Redis, Vercel KV, Supabase) for production.

declare global {
  // eslint-disable-next-line no-var
  var __shortLinkStore: Map<string, string> | undefined
}

if (!global.__shortLinkStore) {
  global.__shortLinkStore = new Map()
}

export const shortLinkStore = global.__shortLinkStore

export function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
