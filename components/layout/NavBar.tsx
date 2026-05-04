'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/builder', label: 'Builder' },
  { href: '/retinues', label: 'My Retinues' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <header className="h-12 shrink-0 flex items-center px-4 gap-4 border-b border-white/8 z-30" style={{ background: 'oklch(0.19 0.018 250)' }}>

      {/* Logo */}
      <Link href="/builder" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors shrink-0">
        <Swords className="h-4 w-4 text-[var(--chart-1)]" />
        <span className="font-heading text-sm font-semibold tracking-wide">Barons&apos; War</span>
        <span className="hidden sm:inline text-white/40 text-xs font-normal">Retinue Builder</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1 ml-2">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/8'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Sign In — placeholder until cloud sync milestone */}
      <span className="text-xs text-white/25 hidden sm:inline">Sign In</span>
    </header>
  )
}
