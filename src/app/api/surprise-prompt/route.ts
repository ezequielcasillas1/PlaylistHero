import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function getApiKeys() {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }
}

interface SurpriseRequest {
  mood?: string
}

const MOOD_THEMES: Record<string, string[]> = {
  happy: ['uplifting pop music', 'comedy compilations', 'feel-good movies', 'cute animal videos', 'dance challenges'],
  sad: ['emotional ballads', 'melancholic indie', 'rainy day playlists', 'heartfelt acoustic covers', 'moving film soundtracks'],
  energetic: ['high-energy EDM', 'workout motivation', 'hype rap', 'action movie clips', 'extreme sports highlights'],
  relaxed: ['ambient soundscapes', 'jazz cafe vibes', 'nature documentaries', 'ASMR content', 'meditation guides'],
  focused: ['concentration music', 'study beats', 'classical piano', 'productivity soundtracks', 'white noise'],
  anxious: ['calming meditation', 'breathing exercises', 'soothing nature sounds', 'gentle classical music', 'stress relief ASMR'],
  romantic: ['love songs', 'romantic movie scenes', 'couples content', 'wedding music', 'date night playlists'],
  angry: ['heavy metal', 'intense workout music', 'aggressive rap', 'cathartic rock', 'boxing training montages'],
  nostalgic: ['80s classics', '90s hits', 'retro gaming', 'old school hip hop', 'vintage music videos'],
  hopeful: ['inspirational talks', 'motivational music', 'success stories', 'uplifting documentaries', 'gospel music'],
  melancholic: ['indie folk', 'atmospheric post-rock', 'rainy mood music', 'bittersweet soundtracks', 'thoughtful piano pieces'],
  excited: ['festival EDM', 'party anthems', 'celebration music', 'hype playlists', 'epic trailer music'],
  peaceful: ['zen garden sounds', 'tibetan bowls', 'forest ambience', 'soft acoustic', 'spa music'],
  adventurous: ['epic orchestral', 'travel vlogs', 'exploration documentaries', 'world music', 'road trip playlists'],
  mysterious: ['dark ambient', 'thriller soundtracks', 'mystery podcasts', 'enigmatic electronica', 'film noir jazz'],
  playful: ['fun pop', 'silly songs', 'comedy sketches', 'game show clips', 'cheerful instrumentals'],
  confident: ['power anthems', 'boss music', 'swagger playlists', 'empowerment songs', 'motivational hip hop'],
  grateful: ['worship music', 'thanksgiving playlists', 'appreciation songs', 'heartwarming content', 'mindfulness guides'],
  lonely: ['late night music', 'solitary piano', 'introspective indie', 'midnight radio vibes', 'comfort playlists'],
  inspired: ['creative flow music', 'artist documentaries', 'innovation talks', 'visionary content', 'genius compilations'],
  christlike: ['bible study teachings', 'gospel worship songs', 'christian sermons', 'praise and worship live sessions', 'scripture reading with music', 'hymns of faith', 'christian testimony stories', 'biblical teachings explained', 'devotional worship music', 'psalms and proverbs readings', 'jesus centered worship', 'christian motivational messages', 'gospel choir performances', 'faith based documentaries', 'sunday service worship'],
}

const DEFAULT_THEMES = [
  'trending music hits',
  'viral video compilations',
  'hidden gem indie artists',
  'classic rock anthems',
  'chill electronic beats',
  'acoustic cover sessions',
  'lo-fi study music',
  'world music exploration',
  'epic movie soundtracks',
  'underground hip hop gems',
]

function buildSurprisePrompt(mood?: string): string {
  const themes = mood && MOOD_THEMES[mood] ? MOOD_THEMES[mood] : DEFAULT_THEMES
  const randomThemes = themes.sort(() => Math.random() - 0.5).slice(0, 3).join(', ')
  
  // Special handling for Christ Like mood - 80% bible-based content
  if (mood === 'christlike') {
    const isBibleBased = Math.random() < 0.8
    
    if (isBibleBased) {
      return `You are a faithful Christian playlist curator. Generate a surprise playlist idea that is Bible-based and Christ-centered.

Focus on themes like: ${randomThemes}

Rules for the surprise prompt:
1. MUST be Bible-based, scripture-inspired, or Christ-centered
2. Can include: biblical teachings, scripture readings, worship music, gospel sermons, faith testimonies, psalms, hymns, christian documentaries
3. Make it spiritually uplifting and faith-building
4. Be specific about the content (book of the Bible, type of worship, sermon topic)
5. Keep it under 150 characters
6. Don't use quotes or special characters
7. Make it feel like a blessing - something to strengthen faith

Examples:
- "powerful psalms of david with peaceful instrumental worship background"
- "verse by verse gospel of john teachings with visual scripture"
- "uplifting gospel choir hymns praising the name of jesus"
- "inspiring christian testimonies of faith and redemption"
- "book of proverbs wisdom readings with gentle piano music"

Respond with ONLY the surprise prompt text, nothing else. No quotes, no explanation, just the Christ-centered suggestion.`
    }
  }
  
  const moodContext = mood 
    ? `The user's current mood is "${mood}". Generate a surprise playlist idea that matches this mood perfectly.`
    : `Generate a completely random but delightful playlist surprise.`

  return `You are a creative playlist curator who loves surprising people with amazing music and video content. ${moodContext}

Consider themes like: ${randomThemes}

Rules for the surprise prompt:
1. Be creative and unexpected - surprise the user!
2. Make it specific and descriptive (genre, style, era, vibe)
3. Include mood-appropriate content suggestions
4. Make it feel like a gift - something they didn't know they needed
5. Keep it natural and exciting to read
6. Be specific about the type of content (music, compilations, live performances, etc.)
7. Keep it under 150 characters
8. Don't use quotes or special characters
9. Make it sound fun and intriguing

Examples of great surprises:
- "late night jazz cafe ambience with soft rain and cozy fireplace sounds"
- "underground 90s hip hop classics you probably never heard"
- "epic orchestral covers of modern pop songs by full symphony"
- "hidden gem acoustic sessions from small venue performances"
- "nostalgic video game soundtracks that defined a generation"

Respond with ONLY the surprise prompt text, nothing else. No quotes, no explanation, just the creative surprise suggestion.`
}

async function callGemini(systemPrompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 1.0,
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
      temperature: 1.0,
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

    const body: SurpriseRequest = await request.json()
    const { mood } = body

    if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const systemPrompt = buildSurprisePrompt(mood)
    let surprisePrompt: string | null = null

    if (GEMINI_API_KEY) {
      try {
        surprisePrompt = await callGemini(systemPrompt, GEMINI_API_KEY)
      } catch (error) {
        console.error('Gemini surprise failed:', error)
      }
    }

    if (!surprisePrompt && OPENAI_API_KEY) {
      try {
        surprisePrompt = await callOpenAI(systemPrompt, OPENAI_API_KEY)
      } catch (error) {
        console.error('OpenAI surprise failed:', error)
      }
    }

    if (!surprisePrompt) {
      return NextResponse.json(
        { error: 'Failed to generate surprise' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      surprisePrompt: surprisePrompt.replace(/^["']|["']$/g, '').trim(),
    })
  } catch (error) {
    console.error('Surprise API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate surprise' },
      { status: 500 }
    )
  }
}
