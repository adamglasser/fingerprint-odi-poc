'use client';

import { useEffect, useState } from 'react';
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';
// See https://dev.fingerprint.com/docs/js-agent-static#installation for more information
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro-static';

export default function FingerprintProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we only render this on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render the provider during SSR
  if (!isMounted) {
    return children;
  }

  return (
    <FpjsProvider
      loadOptions={{
        apiKey: "A5dUKxfbZOeQQ4vEU4AA",
        region: "us",
        modules: [
          FingerprintJS.makeIdentificationModule(),
          FingerprintJS.makeBotdModule(),
          FingerprintJS.makeLatencyReportModule(),
        ],
      }}
      customAgent={FingerprintJS}
    >
      {children}
    </FpjsProvider>
  );
} 

