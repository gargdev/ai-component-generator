'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/projects': 'Projects',
  '/dashboard/projects/new': 'New Project',
  '/dashboard/components': 'Components',
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}