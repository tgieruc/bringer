'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  workspaceId: string
}

export function MobileNav({ workspaceId }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mr-2"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="container py-6">
            <div className="flex flex-col gap-4">
              <Link
                href={`/w/${workspaceId}/lists`}
                className="text-lg font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                Shopping Lists
              </Link>
              <Link
                href={`/w/${workspaceId}/recipes`}
                className="text-lg font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                Recipes
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
