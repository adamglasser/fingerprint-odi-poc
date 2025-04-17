'use client';

import { useState, useEffect } from 'react';
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';

// We need to handle the dynamic import of the Fingerprint library
export default function FingerprintProvider({ children }) {
  const [FingerprintJS, setFingerprintJS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the Fingerprint library dynamically only on the client
    import('@fingerprintjs/fingerprintjs-pro-static')
      .then((module) => {
        // Set a small timeout to ensure proper initialization
        setTimeout(() => {
          setFingerprintJS(module);
          setLoading(false);
        }, 100);
      })
      .catch((err) => {
        console.error('Failed to load Fingerprint:', err);
        setLoading(false);
      });
  }, []);

  // Always render children during loading to prevent content flash
  if (loading || !FingerprintJS) {
    return children;
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