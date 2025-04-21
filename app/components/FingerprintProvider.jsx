'use client';

import { useEffect, useState, createContext, useContext, useRef } from 'react';
// See https://dev.fingerprint.com/docs/js-agent-static#installation for more information
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro-static';

// Default context value to avoid null errors
const defaultContextValue = {
  collectBrowserData: async () => null,
  sendToBackend: async () => null,
  completeIdentification: async () => null,
  collectLatency: null,
  visitorId: null,
  isLoading: false,
  error: null,
  setLatency: () => {},
  processingPhase: 'initial',
  browserData: null,
  backendData: null,
  backendLatency: null,
  storageLatency: null,
  identificationLatency: null,
  resetEnvironment: () => null,
  registerResetCallback: () => () => {}, // Returns unregister function
};

// Create a context to share Fingerprint functionality across components
export const FingerprintContext = createContext(defaultContextValue);

export function useFingerprintODI() {
  return useContext(FingerprintContext);
}

export default function FingerprintProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [fpInstance, setFpInstance] = useState(null);
  const [collectLatency, setCollectLatency] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingPhase, setProcessingPhase] = useState('initial'); // initial, collecting, processing, complete
  const [browserData, setBrowserData] = useState(null);
  const [backendData, setBackendData] = useState(null); 
  const [backendLatency, setBackendLatency] = useState(null);
  const [storageLatency, setStorageLatency] = useState(null); // Add storage latency tracking
  const [identificationLatency, setIdentificationLatency] = useState(null); // Add identification latency tracking
  
  // Keep track of reset callbacks
  const resetCallbacksRef = useRef([]);
  // Keep a reference to the loadFpAndCollect function for resets
  const loadFpAndCollectRef = useRef(null);

  // Shared function for collecting and storing data
  const collectAndStoreData = async (instance) => {
    if (!instance) return null;
    
    setIsLoading(true);
    setProcessingPhase('collecting');
    // Reset latency values to ensure we only measure actual processing time
    setCollectLatency(null);
    setBackendLatency(null);
    
    const startTime = performance.now();
    
    try {
      const data = await instance.collect();
      const browserCollectLatency = performance.now() - startTime;
      setCollectLatency(browserCollectLatency);
      setBrowserData(data);
      setProcessingPhase('processing');
      
      // Store in sessionStorage
      try {
        sessionStorage.setItem('fpBrowserData', data);
        sessionStorage.setItem('fpCollectLatency', browserCollectLatency.toString());
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
            // Do NOT modify the modules array as all are required for ODI to work
            modules: [
              FingerprintJS.makeIdentificationModule(),
              FingerprintJS.makeBotdModule(),
              FingerprintJS.makeLatencyReportModule(),
            ],
          });
          setFpInstance(fp);
          
          // Use the shared function to collect data
          await collectAndStoreData(fp);
          
        } catch (err) {
          console.error("Failed to load Fingerprint or collect data:", err);
          setError(err);
          setProcessingPhase('error');
        }
      };
      
      // Store the function in a ref for later use in resetEnvironment
      loadFpAndCollectRef.current = loadFpAndCollect;
      
      // Check if we already have browser data in session storage
      const storedBrowserData = sessionStorage.getItem('fpBrowserData');
      const storedLatency = sessionStorage.getItem('fpCollectLatency');
      const storedPhase = sessionStorage.getItem('fpProcessingPhase');
      const storedBackendLatency = sessionStorage.getItem('fpBackendLatency');
      const storedStorageLatency = sessionStorage.getItem('fpStorageLatency');
      const storedIdentificationLatency = sessionStorage.getItem('fpIdentificationLatency');
      const storedVisitorId = sessionStorage.getItem('fpVisitorId');
      
      if (storedBrowserData) {
        setBrowserData(storedBrowserData);
        if (storedLatency) setCollectLatency(parseFloat(storedLatency));
        if (storedPhase) setProcessingPhase(storedPhase);
        if (storedBackendLatency) setBackendLatency(parseFloat(storedBackendLatency));
        if (storedStorageLatency) setStorageLatency(parseFloat(storedStorageLatency));
        if (storedIdentificationLatency) setIdentificationLatency(parseFloat(storedIdentificationLatency));
        if (storedVisitorId) setVisitorId(storedVisitorId);
      } else {
        loadFpAndCollect();
      }
    }
  }, []);

  // Function to collect browser data - now just a wrapper around the shared function
  const collectBrowserData = async () => {
    return collectAndStoreData(fpInstance);
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
      
      // Send to our backend API but don't call /send endpoint yet
      const response = await fetch('/api/store-fingerprint', {
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
      
      // Store the backend response, but don't complete identification yet
      setBackendData(data);
      setStorageLatency(sendLatency); // Store storage latency separately
      setBackendLatency(sendLatency); // Total backend latency starts with storage
      setProcessingPhase('stored');
      
      // Store in sessionStorage
      try {
        sessionStorage.setItem('fpStorageLatency', sendLatency.toString());
        sessionStorage.setItem('fpBackendLatency', sendLatency.toString());
        sessionStorage.setItem('fpProcessingPhase', 'stored');
      } catch (err) {
        console.error('Error storing in sessionStorage:', err);
      }
      
      return data;
    } catch (err) {
      console.error("Error sending data to backend:", err);
      setError(err);
      setProcessingPhase('error');
      return null;
    }
  };

  // Function to complete identification by calling /send endpoint and handling agent data
  const completeIdentification = async () => {
    if (!backendData) {
      
      return null;
    }
    
    try {
      setProcessingPhase('identifying');
      
      const startTime = performance.now();
      
      // Now call the endpoint that triggers Fingerprint's /send endpoint
      const response = await fetch('/api/send-fingerprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backendData }),
      });
      
      if (!response.ok) {
        throw new Error(`Identification request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const identifyLatency = performance.now() - startTime;
      
      // Handle the agent data from the response
      if (data.agentData && fpInstance) {
        await FingerprintJS.handleAgentData(data.agentData);
      }
      
      // Update our state with the complete identification data
      setBackendData({
        ...data,
        storageLatency: storageLatency || 0  // Include storage latency in the data
      });
      setIdentificationLatency(identifyLatency); // Store identification latency separately
      setBackendLatency((storageLatency || 0) + identifyLatency); // Update total backend latency
      setProcessingPhase('complete');
      
      if (data.visitorId) {
        setVisitorId(data.visitorId);
        try {
          sessionStorage.setItem('fpVisitorId', data.visitorId);
          sessionStorage.setItem('fpIdentificationLatency', identifyLatency.toString());
          sessionStorage.setItem('fpBackendLatency', ((storageLatency || 0) + identifyLatency).toString());
          sessionStorage.setItem('fpProcessingPhase', 'complete');
        } catch (err) {
          // Silently handle sessionStorage errors
        }
      }
      
      return data;
    } catch (err) {
      setError(err);
      setProcessingPhase('error');
      return null;
    }
  };

  // Function to register callbacks for reset events
  const registerResetCallback = (callback) => {
    if (typeof callback === 'function') {
      resetCallbacksRef.current.push(callback);
      
      // Return a function to unregister this callback
      return () => {
        resetCallbacksRef.current = resetCallbacksRef.current.filter(cb => cb !== callback);
      };
    }
    return () => {}; // Return empty function if invalid callback
  };

  // Function to reset the environment
  const resetEnvironment = () => {
    // Clear Fingerprint cookies
    if (typeof document !== 'undefined') {
      // Delete _iidt cookie by setting expiration in the past
      document.cookie = '_iidt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      
      // Delete any additional Fingerprint cookies that might exist
      document.cookie = '_vid_t=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      document.cookie = '_dd_s=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    }
    
    // Clear session storage
    try {
      sessionStorage.removeItem('fpBrowserData');
      sessionStorage.removeItem('fpCollectLatency');
      sessionStorage.removeItem('fpProcessingPhase');
      sessionStorage.removeItem('fpBackendLatency');
      sessionStorage.removeItem('fpStorageLatency');
      sessionStorage.removeItem('fpIdentificationLatency');
      sessionStorage.removeItem('fpVisitorId');
    } catch (err) {
      console.error('Error clearing sessionStorage:', err);
    }
    
    // Reset state
    setCollectLatency(null);
    setVisitorId(null);
    setError(null);
    setProcessingPhase('initial');
    setBrowserData(null);
    setBackendData(null);
    setBackendLatency(null);
    setStorageLatency(null);
    setIdentificationLatency(null);
    
    // Notify subscribers about the reset
    resetCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('Error executing reset callback:', err);
      }
    });
    
    // Reload Fingerprint instance and collect data
    if (fpInstance) {
      // Collect new data using existing instance
      collectBrowserData();
    } else if (loadFpAndCollectRef.current) {
      // If no instance but we have the loader function in our ref
      loadFpAndCollectRef.current();
    } else {
      // Error case, should not happen in normal usage
      console.warn("No fingerprint instance or loader function available for reset");
    }
  };

  // Create context value
  const contextValue = isMounted ? {
    collectBrowserData,
    sendToBackend,
    completeIdentification,
    collectLatency,
    visitorId,
    isLoading,
    error,
    setLatency: setCollectLatency,
    processingPhase,
    browserData,
    backendData,
    backendLatency,
    storageLatency,
    identificationLatency,
    resetEnvironment,
    registerResetCallback,
  } : defaultContextValue;

  return (
    <FingerprintContext.Provider value={contextValue}>
      {children}
    </FingerprintContext.Provider>
  );
} 

