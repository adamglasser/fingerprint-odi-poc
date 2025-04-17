'use client';

import { useEffect, useState, createContext, useContext } from 'react';
// See https://dev.fingerprint.com/docs/js-agent-static#installation for more information
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro-static';

// Default context value to avoid null errors
const defaultContextValue = {
  collectBrowserData: async () => null,
  sendToBackend: async () => null,
  latency: null,
  visitorId: null,
  isLoading: false,
  error: null,
  setLatency: () => {},
  processingPhase: 'initial',
  browserData: null,
  backendData: null,
  backendLatency: null,
};

// Create a context to share Fingerprint functionality across components
export const FingerprintContext = createContext(defaultContextValue);

export function useFingerprintODI() {
  return useContext(FingerprintContext);
}

export default function FingerprintProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [fpInstance, setFpInstance] = useState(null);
  const [latency, setLatency] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingPhase, setProcessingPhase] = useState('initial'); // initial, collecting, processing, complete
  const [browserData, setBrowserData] = useState(null);
  const [backendData, setBackendData] = useState(null); 
  const [backendLatency, setBackendLatency] = useState(null);

  // Initialize the Fingerprint agent once on the client side and start collection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      
      const loadFpAndCollect = async () => {
        try {
          // Load FP instance
          setProcessingPhase('initial');
          const fp = await FingerprintJS.load({
            apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY || "A5dUKxfbZOeQQ4vEU4AA",
            region: "us",
            modules: [
              FingerprintJS.makeIdentificationModule(),
              FingerprintJS.makeBotdModule(),
              FingerprintJS.makeLatencyReportModule(),
            ],
          });
          setFpInstance(fp);
          
          // Start collection immediately
          setProcessingPhase('collecting');
          setIsLoading(true);
          const startTime = performance.now();
          
          const data = await fp.collect();
          const collectLatency = performance.now() - startTime;
          setLatency(collectLatency);
          setBrowserData(data);
          setProcessingPhase('processing');
          
          // Store in sessionStorage for persistence across pages
          try {
            sessionStorage.setItem('fpBrowserData', data);
            sessionStorage.setItem('fpCollectLatency', collectLatency.toString());
            sessionStorage.setItem('fpProcessingPhase', 'processing');
          } catch (err) {
            console.error('Error storing in sessionStorage:', err);
          }
          
        } catch (err) {
          console.error("Failed to load Fingerprint or collect data:", err);
          setError(err);
          setProcessingPhase('error');
        } finally {
          setIsLoading(false);
        }
      };
      
      // Check if we already have browser data in session storage
      const storedBrowserData = sessionStorage.getItem('fpBrowserData');
      const storedLatency = sessionStorage.getItem('fpCollectLatency');
      const storedPhase = sessionStorage.getItem('fpProcessingPhase');
      const storedBackendLatency = sessionStorage.getItem('fpBackendLatency');
      const storedVisitorId = sessionStorage.getItem('fpVisitorId');
      
      if (storedBrowserData) {
        setBrowserData(storedBrowserData);
        if (storedLatency) setLatency(parseFloat(storedLatency));
        if (storedPhase) setProcessingPhase(storedPhase);
        if (storedBackendLatency) setBackendLatency(parseFloat(storedBackendLatency));
        if (storedVisitorId) setVisitorId(storedVisitorId);
      } else {
        loadFpAndCollect();
      }
    }
  }, []);

  // Function to collect browser data (if needed again)
  const collectBrowserData = async () => {
    if (!fpInstance) return null;
    
    setIsLoading(true);
    setProcessingPhase('collecting');
    const startTime = performance.now();
    
    try {
      const data = await fpInstance.collect();
      const collectLatency = performance.now() - startTime;
      setLatency(collectLatency);
      setBrowserData(data);
      setProcessingPhase('processing');
      
      // Store in sessionStorage
      try {
        sessionStorage.setItem('fpBrowserData', data);
        sessionStorage.setItem('fpCollectLatency', collectLatency.toString());
        sessionStorage.setItem('fpProcessingPhase', 'processing');
      } catch (err) {
        console.error('Error storing in sessionStorage:', err);
      }
      
      return data;
    } catch (err) {
      console.error("Error collecting browser data:", err);
      setError(err);
      setProcessingPhase('error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send browser data to our backend
  const sendToBackend = async (bData = null) => {
    const dataToSend = bData || browserData;
    
    if (!dataToSend) {
      console.error("No browser data available to send");
      return null;
    }
    
    try {
      setProcessingPhase('sending');
      const startTime = performance.now();
      
      const response = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fingerprintData: dataToSend }),
      });
      
      if (!response.ok) {
        throw new Error(`Backend request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const sendLatency = performance.now() - startTime;
      
      // Handle the agent data from the response
      if (data.agentData && fpInstance) {
        await FingerprintJS.handleAgentData(data.agentData);
      }
      
      setBackendData(data);
      setBackendLatency(data.backendLatency || sendLatency);
      setProcessingPhase('complete');
      
      if (data.visitorId) {
        setVisitorId(data.visitorId);
        try {
          sessionStorage.setItem('fpVisitorId', data.visitorId);
          sessionStorage.setItem('fpBackendLatency', data.backendLatency.toString());
          sessionStorage.setItem('fpProcessingPhase', 'complete');
        } catch (err) {
          console.error('Error storing in sessionStorage:', err);
        }
      }
      
      return data;
    } catch (err) {
      console.error("Error sending data to backend:", err);
      setError(err);
      setProcessingPhase('error');
      return null;
    }
  };

  // Create context value
  const contextValue = isMounted ? {
    collectBrowserData,
    sendToBackend,
    latency,
    visitorId,
    isLoading,
    error,
    setLatency,
    processingPhase,
    browserData,
    backendData,
    backendLatency,
  } : defaultContextValue;

  return (
    <FingerprintContext.Provider value={contextValue}>
      {children}
    </FingerprintContext.Provider>
  );
} 

