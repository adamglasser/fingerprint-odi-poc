import './globals.css'
import { Inter } from 'next/font/google'
import FingerprintWrapper from './components/FingerprintWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Next.js',
  description: 'Generated by Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FingerprintWrapper>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </FingerprintWrapper>
      </body>
    </html>
  )
}
