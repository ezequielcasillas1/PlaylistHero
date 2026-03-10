import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface MoodDetectRequest {
  moodText: string
}

interface MoodDetectResponse {
  searchQueries: string[]
  suggestedCategories: string[]
  suggestedFilters: {
    duration?: 'short' | 'medium' | 'long'
    theme?: string
  }
  detectedMood: string
  moodEmoji: string
}

const MOOD_MAPPINGS: Record<string, { emoji: string, categories: string[] }> = {
  happy: { emoji: '😊', categories: ['music', 'entertainment', 'gaming'] },
  sad: { emoji: '😢', categories: ['music'] },
  energetic: { emoji: '⚡', categories: ['music', 'sports', 'gaming'] },
  relaxed: { emoji: '😌', categories: ['music', 'education'] },
  focused: { emoji: '🎯', categories: ['education', 'technology'] },
  anxious: { emoji: '😰', categories: ['music'] },
  romantic: { emoji: '💕', categories: ['music', 'entertainment'] },
  angry: { emoji: '😤', categories: ['music', 'sports', 'gaming'] },
  nostalgic: { emoji: '🥹', categories: ['music', 'entertainment'] },
  hopeful: { emoji: '🌟', categories: ['music', 'education'] },
  melancholic: { emoji: '🌧️', categories: ['music'] },
  excited: { emoji: '🎉', categories: ['entertainment', 'gaming', 'sports'] },
  peaceful: { emoji: '🕊️', categories: ['music', 'education'] },
  adventurous: { emoji: '🏔️', categories: ['entertainment', 'sports'] },
  mysterious: { emoji: '🔮', categories: ['entertainment', 'music'] },
  playful: { emoji: '🎮', categories: ['gaming', 'entertainment'] },
  confident: { emoji: '💪', categories: ['music', 'sports'] },
  grateful: { emoji: '🙏', categories: ['music'] },
  lonely: { emoji: '🌙', categories: ['music'] },
  inspired: { emoji: '💡', categories: ['education', 'technology'] },
  productive: { emoji: '📈', categories: ['education', 'technology'] },
  cozy: { emoji: '🛋️', categories: ['music', 'entertainment'] },
  party: { emoji: '🎊', categories: ['music', 'entertainment'] },
  workout: { emoji: '🏋️', categories: ['music', 'sports'] },
  study: { emoji: '📚', categories: ['education', 'music'] },
  chill: { emoji: '😎', categories: ['music', 'entertainment'] },
  creative: { emoji: '🎨', categories: ['education', 'technology', 'entertainment'] },
}

async function detectMoodWithGemini(moodText: string): Promise<MoodDetectResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  const prompt = `You are a mood analyzer for a video discovery app. Analyze the user's mood description and generate YouTube search queries.

User's mood/activity description: "${moodText}"

Analyze this and respond in JSON format only:
{
  "searchQueries": ["query1", "query2", "query3", "query4", "query5"],
  "suggestedCategories": ["category1", "category2"],
  "suggestedFilters": {
    "duration": "short" | "medium" | "long" | null,
    "theme": "theme_name" | null
  },
  "detectedMood": "single_word_mood",
  "moodEmoji": "single_emoji"
}

Rules:
1. Generate 5 specific YouTube search queries that match the mood/activity
2. Categories must be from: trending, music, gaming, news, sports, entertainment, education, technology
3. Duration: "short" for quick content, "medium" for regular, "long" for deep dives
4. Themes: christmas, halloween, summer, winter, spring, fall, workout, study, party, chill
5. detectedMood should be a single word that best describes the feeling
6. Include relevant content types (lofi, ambient, energetic, etc.) in queries
7. Make queries specific and optimized for YouTube search

Examples:
- "chill evening" → lofi beats, relaxing music, ambient sounds
- "workout pump" → workout music, gym motivation, high energy
- "study session" → study music, focus beats, concentration
- "feeling sad" → sad songs, emotional music, melancholic
- "party time" → party music, dance hits, club bangers`

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', errorText)
    throw new Error('Gemini API request failed')
  }

  const data = await response.json()
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textResponse) {
    throw new Error('Empty Gemini response')
  }

  const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response')
  }

  return JSON.parse(jsonMatch[0])
}

function getFallbackResponse(moodText: string): MoodDetectResponse {
  const lowerText = moodText.toLowerCase()
  
  for (const [mood, data] of Object.entries(MOOD_MAPPINGS)) {
    if (lowerText.includes(mood)) {
      return {
        searchQueries: [
          `${mood} music playlist`,
          `${mood} vibes videos`,
          `best ${mood} content`,
          `${mood} mood mix`,
          `${mood} atmosphere`,
        ],
        suggestedCategories: data.categories,
        suggestedFilters: {},
        detectedMood: mood,
        moodEmoji: data.emoji,
      }
    }
  }
  
  return {
    searchQueries: [
      moodText,
      `${moodText} music`,
      `${moodText} videos`,
      `${moodText} vibes`,
      `${moodText} playlist`,
    ],
    suggestedCategories: ['music', 'entertainment'],
    suggestedFilters: {},
    detectedMood: 'neutral',
    moodEmoji: '🎯',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MoodDetectRequest = await request.json()
    const { moodText } = body

    if (!moodText || moodText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mood text is required' },
        { status: 400 }
      )
    }

    let result: MoodDetectResponse

    try {
      result = await detectMoodWithGemini(moodText.trim())
    } catch (error) {
      console.error('Gemini mood detection failed, using fallback:', error)
      result = getFallbackResponse(moodText.trim())
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Mood detect API error:', error)
    return NextResponse.json(
      { error: 'Failed to detect mood' },
      { status: 500 }
    )
  }
}
