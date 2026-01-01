import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex items-center h-16 space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Bringer</span>
            </Link>
          </div>
          {/* TODO: Add user dropdown menu here */}
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
          <Separator orientation="vertical" className="h-auto" />
          <main className="flex-1 py-6 pl-4">{children}</main>
        </div>
      </div>
    </div>
  )
}
