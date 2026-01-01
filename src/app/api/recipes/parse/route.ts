import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Mistral } from '@mistralai/mistralai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
})

interface ParsedRecipe {
  title: string
  instructions: string
  ingredients: Array<{
    name: string
    note: string
  }>
  image_url?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { input, type, workspaceId } = await request.json()

    if (!input || !type || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: input, type, workspaceId' },
        { status: 400 }
      )
    }

    if (!['url', 'text', 'image'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be url, text, or image' },
        { status: 400 }
      )
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      )
    }

    let textContent = input

    // If image, use Mistral OCR to extract text
    if (type === 'image') {
      try {
        // Input should be base64 data URL (e.g., "data:image/jpeg;base64,...")
        const chatResponse = await mistral.chat.complete({
          model: 'pixtral-12b-2409',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this recipe image. Include the recipe title, all ingredients with quantities, and all cooking instructions. Be thorough and accurate.',
                },
                {
                  type: 'image_url',
                  imageUrl: input,
                },
              ],
            },
          ],
        })

        textContent = chatResponse.choices?.[0]?.message?.content || ''
        if (!textContent) {
          return NextResponse.json(
            { error: 'Failed to extract text from image' },
            { status: 400 }
          )
        }
      } catch (error) {
        console.error('Error processing image with Mistral:', error)
        return NextResponse.json(
          { error: 'Failed to process image' },
          { status: 400 }
        )
      }
    }

    // If URL, fetch the page content
    if (type === 'url') {
      try {
        const response = await fetch(input)
        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch URL content' },
            { status: 400 }
          )
        }
        const html = await response.text()
        
        // Basic HTML to text extraction (remove scripts, styles, tags)
        textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        // Limit content length to avoid token limits
        if (textContent.length > 15000) {
          textContent = textContent.substring(0, 15000) + '...'
        }
      } catch (error) {
        console.error('Error fetching URL:', error)
        return NextResponse.json(
          { error: 'Failed to fetch URL' },
          { status: 400 }
        )
      }
    }

    // Use OpenAI to parse recipe with structured output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `You are a recipe parser. Extract recipe information from the provided text. 
Be precise and extract all ingredients with their quantities.
For instructions, keep them clear and step-by-step.
If no clear recipe is found, do your best to extract any cooking-related information.`,
        },
        {
          role: 'user',
          content: textContent,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The recipe title',
              },
              instructions: {
                type: 'string',
                description: 'Step-by-step cooking instructions',
              },
              ingredients: {
                type: 'array',
                description: 'List of ingredients',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Ingredient name (e.g., "flour", "eggs")',
                    },
                    note: {
                      type: 'string',
                      description: 'Quantity and preparation notes (e.g., "2 cups", "3 large, beaten")',
                    },
                  },
                  required: ['name', 'note'],
                  additionalProperties: false,
                },
              },
              image_url: {
                type: ['string', 'null'],
                description: 'URL of recipe image if found in the content, or null',
              },
            },
            required: ['title', 'instructions', 'ingredients', 'image_url'],
            additionalProperties: false,
          },
        },
      },
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to parse recipe' },
        { status: 500 }
      )
    }

    const parsedRecipe: ParsedRecipe = JSON.parse(content)

    return NextResponse.json({
      recipe: {
        title: parsedRecipe.title,
        instructions: parsedRecipe.instructions,
        ingredients: parsedRecipe.ingredients,
        image_url: parsedRecipe.image_url || null,
        external_link: type === 'url' ? input : null,
      },
    })
  } catch (error) {
    console.error('Error parsing recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
