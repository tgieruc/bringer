import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface ItemIconProps {
  iconKey: string | null
  name: string
  className?: string
}

export function ItemIcon({ iconKey, name, className = "h-5 w-5" }: ItemIconProps) {
  if (!iconKey) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}>
        <span className="text-xs font-medium">{name[0]?.toUpperCase()}</span>
      </div>
    )
  }

  // Convert kebab-case icon key to PascalCase for Lucide
  const iconName = iconKey
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon | undefined
  
  if (!Icon) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}>
        <span className="text-xs font-medium">{name[0]?.toUpperCase()}</span>
      </div>
    )
  }

  return <Icon className={className} />
}
