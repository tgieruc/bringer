import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'
import { MobileNav } from '@/components/mobile-nav'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <MobileNav workspaceId={workspaceId} />
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Bringer</span>
            </Link>
          </div>
          {user?.email && <UserMenu userEmail={user.email} />}
        </div>
      </header>
      <div className="container flex-1">
        <div className="flex">
          <aside className="hidden w-48 py-6 pr-4 md:block">
            <nav className="flex flex-col gap-2">
              <Link href={`/w/${workspaceId}/lists`} className="text-sm font-medium text-muted-foreground hover:text-primary">
                Shopping Lists
              </Link>
              <Link href={`/w/${workspaceId}/recipes`} className="text-sm font-medium text-muted-foreground hover:text-primary">
                Recipes
              </Link>
            </nav>
          </aside>
          <Separator orientation="vertical" className="hidden md:block h-auto" />
          <main id="main-content" className="flex-1 py-6 md:pl-4">{children}</main>
        </div>
      </div>
    </div>
  )
}
