import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "People's Bill Platform - Ghana",
  description: 'Citizen-powered legislation for the Reverse Burden Act',
  keywords: 'Ghana, democracy, legislation, anti-corruption, citizen participation',
  openGraph: {
    title: "People's Bill Platform",
    description: 'Shape Ghana\'s future through democratic participation',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-8">
                    {/* Logo with Ghana colors */}
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        <div className="w-2 h-8 bg-red-600"></div>
                        <div className="w-2 h-8 bg-yellow-400"></div>
                        <div className="w-2 h-8 bg-green-600"></div>
                      </div>
                      <span className="font-bold text-xl text-gray-900">
                        People's Bill
                      </span>
                    </div>
                    
                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-6">
                      <a href="/" className="text-gray-700 hover:text-gray-900">
                        Home
                      </a>
                      <a href="/submit" className="text-gray-700 hover:text-gray-900">
                        Submit
                      </a>
                      <a href="/bill" className="text-gray-700 hover:text-gray-900">
                        View Bill
                      </a>
                      <a href="/stats" className="text-gray-700 hover:text-gray-900">
                        Statistics
                      </a>
                      <a href="/about" className="text-gray-700 hover:text-gray-900">
                        About
                      </a>
                    </nav>
                  </div>
                  
                  {/* Right side */}
                  <div className="flex items-center space-x-4">
                    <select className="text-sm border rounded px-2 py-1">
                      <option value="en">English</option>
                      <option value="tw">Twi (Coming)</option>
                      <option value="ga">Ga (Coming)</option>
                    </select>
                    
                    <a 
                      href="/admin"
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Admin
                    </a>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="font-bold text-lg mb-4">People's Bill</h3>
                    <p className="text-gray-400 text-sm">
                      Empowering Ghanaians to shape their own legislation through 
                      democratic participation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li><a href="/submit" className="hover:text-white">Submit Input</a></li>
                      <li><a href="/bill" className="hover:text-white">Read the Bill</a></li>
                      <li><a href="/stats" className="hover:text-white">View Statistics</a></li>
                      <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Regions</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li>Greater Accra</li>
                      <li>Ashanti</li>
                      <li>Northern</li>
                      <li><a href="/regions" className="hover:text-white">All 16 Regions →</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li>Email: info@peoplesbill.gh</li>
                      <li>WhatsApp: +233 XX XXX XXXX</li>
                      <li>Office: Accra, Ghana</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                  <p>© 2025 People's Bill Platform. Built with ❤️ for Ghana's democratic future.</p>
                  <p className="mt-2">
                    <a href="/privacy" className="hover:text-white">Privacy Policy</a>
                    {' · '}
                    <a href="/terms" className="hover:text-white">Terms of Service</a>
                    {' · '}
                    <a href="/open-source" className="hover:text-white">Open Source</a>
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
