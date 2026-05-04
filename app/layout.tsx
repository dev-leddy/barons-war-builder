import type { Metadata } from 'next'
import { IM_Fell_English, Inter } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NavBar } from '@/components/layout/NavBar'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const imFell = IM_Fell_English({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: "Barons' War Retinue Builder",
  description: "Build and share retinues for The Barons' War (2nd Ed, 2025)",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${imFell.variable}`}>
      <body className="h-screen flex flex-col overflow-hidden antialiased">
        <TooltipProvider delay={300}>
          <NavBar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
}
