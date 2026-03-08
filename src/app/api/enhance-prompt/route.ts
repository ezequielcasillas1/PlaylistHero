import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function getApiKeys() {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }
}

interface EnhanceRequest {
  prompt: string
  mood?: string
}

function buildEnhancePrompt(userPrompt: string, mood?: string): string {
  const moodContext = mood ? `\nThe user's current mood is "${mood}" - incorporate this into the enhanced prompt.` : ''
  
  return `You are an expert at crafting perfect YouTube search queries. Transform the user's casual description into a detailed, specific search prompt that will find the best content.

User's input: "${userPrompt}"${moodContext}

Rules for the enhanced prompt:
1. Make it specific and descriptive (what type of content, style, era, quality)
2. Include relevant keywords YouTube's algorithm loves
3. Keep it natural and readable (not just keyword stuffing)
4. Add context clues for better matching (genre, era, style, creator type)
5. If it's about music: include genre, mood, tempo, similar artists
6. If it's about news/events: add timeframe (latest, 2024, this week)
7. If it's about tutorials: specify skill level, tools, goals
8. Make it feel like a thoughtful, well-crafted search request
9. Keep it under 150 characters for best results
10. Don't use quotes or special characters

Examples:
- "lofi music" → "chill lofi hip hop beats for studying and relaxation with soft piano and ambient sounds"
- "coding tutorials" → "beginner-friendly web development tutorials with modern JavaScript and React 2024"
- "funny videos" → "hilarious comedy sketches and viral memes compilation with best moments"
- "workout music" → "high energy EDM and hip hop workout mix for intense gym sessions"

Respond with ONLY the enhanced prompt text, nothing else. No quotes, no explanation, just the enhanced search query.`
}

async function callGemini(systemPrompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Gemini API request failed')
  }

  const data = await response.json()
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

  return textResponse?.trim() || null
}

async function callOpenAI(systemPrompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: systemPrompt },
      ],
      temperature: 0.8,
      max_tokens: 256,
    }),
  })

  if (!response.ok) {
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

export async function POST(request: NextRequest) {
  try {
    const { GEMINI_API_KEY, OPENAI_API_KEY } = getApiKeys()

    const body: EnhanceRequest = await request.json()
    const { prompt, mood } = body

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const systemPrompt = buildEnhancePrompt(prompt, mood)
    let enhancedPrompt: string | null = null

    if (GEMINI_API_KEY) {
      try {
        enhancedPrompt = await callGemini(systemPrompt, GEMINI_API_KEY)
      } catch (error) {
        console.error('Gemini enhance failed:', error)
      }
    }

    if (!enhancedPrompt && OPENAI_API_KEY) {
      try {
        enhancedPrompt = await callOpenAI(systemPrompt, OPENAI_API_KEY)
      } catch (error) {
        console.error('OpenAI enhance failed:', error)
      }
    }

    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: 'Failed to enhance prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhancedPrompt.replace(/^["']|["']$/g, '').trim(),
    })
  } catch (error) {
    console.error('Enhance API Error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}
