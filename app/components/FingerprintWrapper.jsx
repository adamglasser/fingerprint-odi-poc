'use client';

import { useState, useEffect } from 'react';
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';

export default function FingerprintWrapper({ children }) {
  const [FingerprintJS, setFingerprintJS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFingerprint() {
      try {
        // Dynamic import only on client side
        const module = await import('@fingerprintjs/fingerprintjs-pro-static');
        
        if (mounted) {
          setFingerprintJS(module);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load Fingerprint:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  // Show a loading state while Fingerprint is initializing
  if (loading || !FingerprintJS) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading Fingerprint...</p>
      </div>
    );
  }

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: "A5dUKxfbZOeQQ4vEU4AA",
        region: "us",
        // @ts-ignore
        modules: [
          FingerprintJS.makeIdentificationModule(),
          FingerprintJS.makeBotdModule(),
          FingerprintJS.makeLatencyReportModule(),
        ],
      }}
      // @ts-ignore
      customAgent={FingerprintJS}
    >
      {children}
    </FpjsProvider>
  );
} 