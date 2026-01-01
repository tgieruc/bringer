import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function RecipeDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" disabled>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Recipes
        </Button>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </div>
      </div>

      {/* Recipe image skeleton */}
      <div className="mb-6">
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients skeleton */}
        <div className="md:col-span-1">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-full mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions skeleton */}
        <div className="md:col-span-2">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
