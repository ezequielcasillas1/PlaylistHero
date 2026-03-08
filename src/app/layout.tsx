import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlaylistHero - AI YouTube Playlist Generator',
  description: 'Create perfect YouTube playlists with AI. Describe your vibe and let PlaylistHero generate the perfect playlist for any mood.',
  keywords: ['youtube', 'playlist', 'generator', 'AI', 'music', 'curated'],
  authors: [{ name: 'PlaylistHero' }],
  openGraph: {
    title: 'PlaylistHero - AI YouTube Playlist Generator',
    description: 'Create perfect YouTube playlists with AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-black via-[#1a0000] to-[#330000]">
          {children}
        </div>
      </body>
    </html>
  )
}
