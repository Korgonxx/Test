import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import { MatrixBackground } from '@/components/ui/MatrixBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Irys Gaming Platform - AI-Powered NPCs on Blockchain',
  description: 'Decentralized gaming platform featuring AI-powered NPCs with behavior stored and executed onchain using Irys blockchain technology.',
  keywords: ['blockchain', 'gaming', 'AI', 'NPCs', 'Irys', 'decentralized', 'Web3'],
  authors: [{ name: 'Irys Gaming Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#00ffff',
  openGraph: {
    title: 'Irys Gaming Platform',
    description: 'AI-Powered NPCs on Blockchain',
    type: 'website',
    url: 'https://irys-gaming.xyz',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Irys Gaming Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Irys Gaming Platform',
    description: 'AI-Powered NPCs on Blockchain',
    images: ['/og-image.png'],
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
        <Providers>
          <MatrixBackground />
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}