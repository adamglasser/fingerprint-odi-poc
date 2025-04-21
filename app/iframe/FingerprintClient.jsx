'use client';

import { useEffect, useRef } from 'react';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro-static';

export default function FingerprintClient() {
  const fpInstanceRef = useRef(null);
  const loadStartTime = useRef(null);
  const loadEndTime = useRef(null);
  
  // Function to send messages to parent window
  const sendMessageToParent = (type, data) => {
    window.parent.postMessage({ type, data }, '*');
  };
  
  // Function to initialize Fingerprint and collect data
  const initializeFingerprint = async () => {
    try {
      loadStartTime.current = performance.now();
      sendMessageToParent('status', { message: 'initializing' });
      
      // Load FP instance
      const fp = await FingerprintJS.load({
        apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY || "A5dUKxfbZOeQQ4vEU4AA",
        region: "us",
        modules: [
          FingerprintJS.makeIdentificationModule(),
          FingerprintJS.makeBotdModule(),
          FingerprintJS.makeLatencyReportModule(),
        ],
      });
      
      fpInstanceRef.current = fp;
      loadEndTime.current = performance.now();
      sendMessageToParent('status', { message: 'initialized' });
      
      // Initial data collection
      collectData();
    } catch (err) {
      console.error("Failed to load Fingerprint:", err);
      sendMessageToParent('error', { message: err.message });
    }
  };
  
  // Function to collect fingerprint data
  const collectData = async () => {
    try {
      sendMessageToParent('status', { message: 'collecting' });
      
      // Start measuring signal collection
      const collectStartTime = performance.now();
      const data = await fpInstanceRef.current.collect();
      const collectEndTime = performance.now();
      
      // Calculate accurate timings for all phases
      const loadLatency = loadEndTime.current - loadStartTime.current;  // Time to load agent
      const collectLatency = collectEndTime - collectStartTime;  // Time to collect signals
      const totalLatency = collectEndTime - loadStartTime.current;  // Total end-to-end time
      
      sendMessageToParent('data', { 
        browserData: data,
        loadLatency,
        collectLatency,
        totalLatency,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error collecting data:", err);
      sendMessageToParent('error', { message: err.message });
    }
  };
  
  // Function to handle agent data from Fingerprint
  const handleAgentData = async (agentData) => {
    if (agentData && fpInstanceRef.current) {
      try {
        await FingerprintJS.handleAgentData(agentData);
        sendMessageToParent('status', { message: 'agentDataHandled' });
      } catch (err) {
        console.error("Error handling agent data:", err);
        sendMessageToParent('error', { message: err.message });
      }
    }
  };
  
  // Function to reset the environment
  const resetEnvironment = () => {
    // Clear Fingerprint cookies
    document.cookie = '_iidt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    document.cookie = '_vid_t=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    document.cookie = '_dd_s=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    
    // Clear the FP instance
    fpInstanceRef.current = null;
    loadStartTime.current = null;
    loadEndTime.current = null;
    
    // Signal that reset is complete
    sendMessageToParent('status', { message: 'reset_complete' });
  };
  
  useEffect(() => {
    // Handle messages from parent
    const handleMessage = (event) => {
      const { type, action } = event.data || {};
      
      if (type === 'command') {
        switch (action) {
          case 'collect':
            collectData();
            break;
          case 'reset':
            resetEnvironment();
            break;
          case 'handleAgentData':
            handleAgentData(event.data.agentData);
            break;
        }
      }
    };
    
    // Add event listener for messages from parent
    window.addEventListener('message', handleMessage);
    
    // Initialize Fingerprint
    initializeFingerprint();
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // The iframe content is invisible and takes minimal space
  return <div className="h-1 w-1" />;
} 