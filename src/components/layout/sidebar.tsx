'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Activity,
  AlertTriangle,
  BookOpen,
  Settings,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    href: '/feed',
    label: 'Agent Feed',
    icon: Activity,
  },
  {
    href: '/incidents',
    label: 'Incident Room',
    icon: AlertTriangle,
  },
  {
    href: '/trails',
    label: 'Knowledge Trails',
    icon: BookOpen,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-black/20 backdrop-blur-lg border-r border-white/10 fixed left-0 top-0 z-50">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white mb-8">
          <Home className="w-6 h-6" />
          NEXUS
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-muted-foreground">
          Nxxus O3
        </div>
      </div>
    </div>
  )
}
