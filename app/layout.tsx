import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope, Playfair_Display, Sora } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-hero-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-hero-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: "People's Bill Platform - Ghana",
  description: 'Reusable civic design system for the Reverse Burden Bill platform',
  keywords: ['Ghana', 'democracy', 'legislation', 'anti-corruption', 'design system'],
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "People's Bill Platform",
    description: 'Citizen-powered legislative workflow for Ghana',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${cormorant.variable} ${playfair.variable} ${manrope.variable} bg-ghana-cream pt-[5px] text-ghana-ink antialiased`}>
        <Providers>
          <div className="fixed inset-x-0 top-0 z-[60] h-[5px] kente-stripe" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
