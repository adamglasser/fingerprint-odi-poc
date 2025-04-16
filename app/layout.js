'use client';

import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FpjsProvider
          loadOptions={{
            apiKey: "A5dUKxfbZOeQQ4vEU4AA",
            region: "us"
          }}
        >
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </FpjsProvider>
      </body>
    </html>
  )
} 