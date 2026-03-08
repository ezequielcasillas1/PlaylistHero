export async function generateFingerprint(): Promise<string> {
  const components: string[] = []

  // Screen properties
  components.push(`${screen.width}x${screen.height}`)
  components.push(`${screen.colorDepth}`)
  components.push(`${window.devicePixelRatio}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Language
  components.push(navigator.language)

  // Platform
  components.push(navigator.platform)

  // Hardware concurrency (CPU cores)
  components.push(`${navigator.hardwareConcurrency || 0}`)

  // Device memory (if available)
  const nav = navigator as Navigator & { deviceMemory?: number }
  components.push(`${nav.deviceMemory || 0}`)

  // Touch support
  components.push(`${navigator.maxTouchPoints || 0}`)

  // WebGL renderer (GPU info)
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      }
    }
  } catch {
    components.push('no-webgl')
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('PlaylistHero', 2, 2)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch {
    components.push('no-canvas')
  }

  // Generate hash from all components
  const fingerprint = components.join('|')
  const hash = await hashString(fingerprint)
  
  return hash
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Store fingerprint in memory to avoid recalculating
let cachedFingerprint: string | null = null

export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint
  cachedFingerprint = await generateFingerprint()
  return cachedFingerprint
}
