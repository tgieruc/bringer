'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles, Image as ImageIcon } from 'lucide-react'

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
  const [inputType, setInputType] = useState<'url' | 'text' | 'image'>('url')
  const [input, setInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setInput(base64String)
      setImagePreview(base64String)
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleImport = async () => {
    if (!input.trim()) {
      toast.error(inputType === 'image' ? 'Please select an image' : 'Please enter a URL or text')
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
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
          Import a recipe from a URL, text, or photo. AI will automatically extract the title, ingredients, and instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={inputType} onValueChange={(value) => {
          setInputType(value as 'url' | 'text' | 'image')
          setInput('')
          setImagePreview(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="url" id="url" />
            <Label htmlFor="url">From URL</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text">From Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="image" />
            <Label htmlFor="image">From Photo</Label>
          </div>
        </RadioGroup>

        <div>
          <Label htmlFor="input">
            {inputType === 'url' ? 'Recipe URL' : inputType === 'text' ? 'Recipe Text' : 'Recipe Photo'}
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
          ) : inputType === 'text' ? (
            <textarea
              id="input"
              placeholder="Paste recipe text here (title, ingredients, instructions)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background"
            />
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isLoading}
                className="hidden"
                id="image-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {imagePreview ? 'Change Photo' : 'Select Photo'}
              </Button>
              {imagePreview && (
                <div className="relative w-full h-[300px]">
                  <Image
                    src={imagePreview}
                    alt="Recipe preview"
                    fill
                    className="object-contain rounded-md border"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleImport} disabled={isLoading || !input} className="w-full">
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              {inputType === 'image' ? 'Reading Photo...' : 'Importing Recipe...'}
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
