const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

interface GeminiResponse {
  searchQueries: string[]
  playlistTitle: string
  playlistDescription: string
}

export async function generatePlaylistFromPrompt(
  prompt: string,
  videoCount: number
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('Gemini API key not configured, returning mock data')
    return getMockGeminiResponse(prompt, videoCount)
  }

  try {
    const systemPrompt = `You are a music playlist curator. Based on the user's description, generate YouTube search queries to find relevant videos.

User wants a playlist with ${videoCount} videos.
User's description: "${prompt}"

Respond in JSON format only:
{
  "searchQueries": ["query1", "query2", ...],
  "playlistTitle": "A catchy title for this playlist",
  "playlistDescription": "A brief description of the playlist vibe"
}

Generate ${Math.min(videoCount, 10)} unique search queries that would find diverse but related content matching the user's vibe.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const textResponse = data.candidates[0].content.parts[0].text
    
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse Gemini response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Gemini API error:', error)
    return getMockGeminiResponse(prompt, videoCount)
  }
}

function getMockGeminiResponse(prompt: string, videoCount: number): GeminiResponse {
  const queries = [
    `${prompt} music`,
    `${prompt} playlist`,
    `${prompt} vibes`,
    `chill ${prompt}`,
    `best ${prompt} songs`,
    `${prompt} mix 2024`,
    `${prompt} ambient`,
    `${prompt} beats`,
    `${prompt} background music`,
    `${prompt} compilation`,
  ].slice(0, Math.min(videoCount, 10))

  return {
    searchQueries: queries,
    playlistTitle: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Vibes`,
    playlistDescription: `A curated playlist based on: ${prompt}`,
  }
}
