'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

interface ParsedRecipe {
  title: string
  instructions: string
  ingredients: Array<{
    name: string
    note: string
  }>
  image_url: string | null
  external_link: string | null
}

interface AIRecipeImportProps {
  workspaceId: string
  onRecipeParsed: (recipe: ParsedRecipe) => void
}

export function AIRecipeImport({ workspaceId, onRecipeParsed }: AIRecipeImportProps) {
  const [inputType, setInputType] = useState<'url' | 'text'>('url')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    if (!input.trim()) {
      toast.error('Please enter a URL or text')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/recipes/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          type: inputType,
          workspaceId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse recipe')
      }

      const data = await response.json()
      toast.success('Recipe imported successfully!')
      onRecipeParsed(data.recipe)
      setInput('')
    } catch (error) {
      console.error('Error importing recipe:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import recipe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Recipe Import
        </CardTitle>
        <CardDescription>
          Import a recipe from a URL or paste recipe text. AI will automatically extract the title, ingredients, and instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={inputType} onValueChange={(value) => setInputType(value as 'url' | 'text')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="url" id="url" />
            <Label htmlFor="url">From URL</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text">From Text</Label>
          </div>
        </RadioGroup>

        <div>
          <Label htmlFor="input">
            {inputType === 'url' ? 'Recipe URL' : 'Recipe Text'}
          </Label>
          {inputType === 'url' ? (
            <Input
              id="input"
              type="url"
              placeholder="https://example.com/recipe"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
          ) : (
            <textarea
              id="input"
              placeholder="Paste recipe text here (title, ingredients, instructions)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background"
            />
          )}
        </div>

        <Button onClick={handleImport} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Importing Recipe...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Import Recipe with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
