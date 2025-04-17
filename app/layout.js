'use client';

import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react'
import './globals.css'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

// Create a client component for FPJS to prevent SSR issues
function FingerprintWrapper({ children }) {
  const [fpjsModule, setFpjsModule] = useState(null);
  const [fpjsAgent, setFpjsAgent] = useState(null);

  useEffect(() => {
    async function loadFPJS() {
      try {
        // Dynamically import the static package on the client side only
        const FPJS = await import('@fingerprintjs/fingerprintjs-pro-static')
        setFpjsModule(FPJS)

        // Create the agent and expose it globally
        const agent = await FPJS.load({
          apiKey: "A5dUKxfbZOeQQ4vEU4AA",
          region: "us",
          // @ts-ignore
          modules: [
            FPJS.makeIdentificationModule(), // If you use identification
            FPJS.makeBotdModule(),           // If you use bot detection
            FPJS.makeLatencyReportModule(),  // For performance monitoring
          ],
        });

        // Expose agent to window object for use in other components
        if (typeof window !== 'undefined') {
          window.fpAgent = agent;
        }
        
        setFpjsAgent(agent);
      } catch (error) {
        console.error('Error loading Fingerprint:', error)
      }
    }
    
    loadFPJS()
  }, [])

  if (!fpjsModule) {
    // Return loading state instead of children without provider
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: "A5dUKxfbZOeQQ4vEU4AA",
        region: "us",
        // @ts-ignore
        modules: [
          fpjsModule.makeIdentificationModule(), // If you use identification
          fpjsModule.makeBotdModule(),           // If you use bot detection
          fpjsModule.makeLatencyReportModule(),  // For performance monitoring
        ],
      }}
      // @ts-ignore
      customAgent={fpjsModule}
    >
      {children}
    </FpjsProvider>
  )
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