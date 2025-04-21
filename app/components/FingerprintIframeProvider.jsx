'use client';

import { useEffect, useState, createContext, useContext, useRef } from 'react';

// Default context value to avoid null errors
const defaultContextValue = {
  collectBrowserData: async () => null,
  sendToBackend: async () => null,
  completeIdentification: async () => null,
  collectLatency: null,
  loadLatency: null,
  totalLatency: null,
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

// Helper function to safely get session storage data (only on client side)
function getSessionStorageData() {
  if (typeof window === 'undefined') {
    return {
      browserData: null,
      collectLatency: null,
      loadLatency: null,
      totalLatency: null,
      processingPhase: 'initial',
      backendLatency: null,
      storageLatency: null,
      identificationLatency: null,
      visitorId: null
    };
  }
  
  try {
    return {
      browserData: sessionStorage.getItem('fpBrowserData') || null,
      collectLatency: sessionStorage.getItem('fpCollectLatency') ? 
        parseFloat(sessionStorage.getItem('fpCollectLatency')) : null,
      loadLatency: sessionStorage.getItem('fpLoadLatency') ? 
        parseFloat(sessionStorage.getItem('fpLoadLatency')) : null,
      totalLatency: sessionStorage.getItem('fpTotalLatency') ? 
        parseFloat(sessionStorage.getItem('fpTotalLatency')) : null,
      processingPhase: sessionStorage.getItem('fpProcessingPhase') || 'initial',
      backendLatency: sessionStorage.getItem('fpBackendLatency') ? 
        parseFloat(sessionStorage.getItem('fpBackendLatency')) : null,
      storageLatency: sessionStorage.getItem('fpStorageLatency') ? 
        parseFloat(sessionStorage.getItem('fpStorageLatency')) : null,
      identificationLatency: sessionStorage.getItem('fpIdentificationLatency') ? 
        parseFloat(sessionStorage.getItem('fpIdentificationLatency')) : null,
      visitorId: sessionStorage.getItem('fpVisitorId') || null
    };
  } catch (err) {
    console.error('Error accessing sessionStorage:', err);
    return {
      browserData: null,
      collectLatency: null,
      loadLatency: null,
      totalLatency: null,
      processingPhase: 'initial',
      backendLatency: null,
      storageLatency: null,
      identificationLatency: null,
      visitorId: null
    };
  }
}

export default function FingerprintIframeProvider({ children }) {
  // Get initial state from session storage (hydration-safe)
  const initialState = getSessionStorageData();
  
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [collectLatency, setCollectLatency] = useState(initialState.collectLatency);
  const [loadLatency, setLoadLatency] = useState(initialState.loadLatency);
  const [totalLatency, setTotalLatency] = useState(initialState.totalLatency);
  const [visitorId, setVisitorId] = useState(initialState.visitorId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingPhase, setProcessingPhase] = useState(initialState.processingPhase);
  const [browserData, setBrowserData] = useState(initialState.browserData);
  const [backendData, setBackendData] = useState(null); 
  const [backendLatency, setBackendLatency] = useState(initialState.backendLatency);
  const [storageLatency, setStorageLatency] = useState(initialState.storageLatency);
  const [identificationLatency, setIdentificationLatency] = useState(initialState.identificationLatency);
  
  // Keep track of reset callbacks
  const resetCallbacksRef = useRef([]);
  // Reference to the iframe element
  const iframeRef = useRef(null);

  // Function to send messages to the iframe
  const sendMessageToIframe = (type, action, data = {}) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type, 
        action,
        ...data 
      }, '*');
    }
  };

  // Initialize the iframe communication
  useEffect(() => {
    // Handle messages from the iframe
    const handleMessage = (event) => {
      const { type, data } = event.data || {};
      
      switch (type) {
        case 'status':
          handleStatusMessage(data);
          break;
        case 'data':
          handleDataMessage(data);
          break;
        case 'error':
          setError(data.message);
          setProcessingPhase('error');
          break;
      }
    };

    // Handle different status messages from the iframe
    const handleStatusMessage = (data) => {
      switch (data.message) {
        case 'initializing':
          setIsLoading(true);
          setProcessingPhase('initializing');
          break;
        case 'initialized':
          setIsLoading(false);
          break;
        case 'collecting':
          setIsLoading(true);
          setProcessingPhase('collecting');
          break;
        case 'reset':
          setProcessingPhase('initial');
          break;
        case 'reset_complete':
          // Reset is complete, start a new collection
          collectBrowserData();
          break;
        case 'agentDataHandled':
          // Agent data has been handled, update UI if needed
          break;
      }
    };

    // Handle data messages from the iframe
    const handleDataMessage = (data) => {
      setIsLoading(false);
      setBrowserData(data.browserData);
      setCollectLatency(data.collectLatency);
      setLoadLatency(data.loadLatency);
      setTotalLatency(data.totalLatency);
      setProcessingPhase('processing');
      
      // Store in sessionStorage for persistence
      try {
        sessionStorage.setItem('fpBrowserData', data.browserData);
        sessionStorage.setItem('fpCollectLatency', data.collectLatency.toString());
        sessionStorage.setItem('fpLoadLatency', data.loadLatency.toString());
        sessionStorage.setItem('fpTotalLatency', data.totalLatency.toString());
        sessionStorage.setItem('fpProcessingPhase', 'processing');
      } catch (err) {
        console.error('Error storing in sessionStorage:', err);
      }
    };

    // Add event listener for iframe messages
    window.addEventListener('message', handleMessage);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to collect browser data
  const collectBrowserData = async () => {
    if (!iframeLoaded) {
      setError('Iframe not loaded');
      return null;
    }
    
    setIsLoading(true);
    setProcessingPhase('collecting');
    sendMessageToIframe('command', 'collect');
    
    // This function doesn't wait for the response since it will come via a message event
    return true;
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
      setStorageLatency(data.backendLatency);
      setBackendLatency(sendLatency);
      setProcessingPhase('stored');
      
      // Store in sessionStorage
      try {
        sessionStorage.setItem('fpStorageLatency', data.backendLatency.toString());
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
      
      // Call the endpoint that triggers Fingerprint's /send endpoint
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
      
      // Handle the agent data from the response by sending it to the iframe
      if (data.agentData) {
        sendMessageToIframe('command', 'handleAgentData', { agentData: data.agentData });
      }
      
      // Update our state with the complete identification data
      setBackendData({
        ...data,
        storageLatency: storageLatency || 0
      });
      setIdentificationLatency(identifyLatency);
      setBackendLatency((storageLatency || 0) + identifyLatency);
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
  const resetEnvironment = async () => {
    // Clear session storage
    try {
      sessionStorage.removeItem('fpBrowserData');
      sessionStorage.removeItem('fpCollectLatency');
      sessionStorage.removeItem('fpLoadLatency');
      sessionStorage.removeItem('fpTotalLatency');
      sessionStorage.removeItem('fpProcessingPhase');
      sessionStorage.removeItem('fpBackendLatency');
      sessionStorage.removeItem('fpStorageLatency');
      sessionStorage.removeItem('fpIdentificationLatency');
      sessionStorage.removeItem('fpVisitorId');
    } catch (err) {
      console.error('Error clearing sessionStorage:', err);
    }
    
    // Clear stored fingerprint data from backend
    try {
      await fetch('/api/clear-fingerprint', {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error clearing fingerprint data:', err);
    }
    
    // Reset state
    setCollectLatency(null);
    setLoadLatency(null);
    setTotalLatency(null);
    setVisitorId(null);
    setError(null);
    setProcessingPhase('initial');
    setBrowserData(null);
    setBackendData(null);
    setBackendLatency(null);
    setStorageLatency(null);
    setIdentificationLatency(null);
    
    // Tell the iframe to reset
    sendMessageToIframe('command', 'reset');
    
    // Notify subscribers about the reset
    resetCallbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('Error executing reset callback:', err);
      }
    });
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Create context value
  const contextValue = {
    collectBrowserData,
    sendToBackend,
    completeIdentification,
    collectLatency,
    loadLatency,
    totalLatency,
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
  };

  return (
    <FingerprintContext.Provider value={contextValue}>
      <div className="fingerprint-iframe-container" style={{ display: 'none' }}>
        <iframe
          ref={iframeRef}
          src="/iframe"
          width="1"
          height="1"
          style={{ border: 'none', position: 'absolute' }}
          onLoad={handleIframeLoad}
          title="Fingerprint Collection"
        />
      </div>
      {children}
    </FingerprintContext.Provider>
  );
} 