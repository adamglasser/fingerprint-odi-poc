'use client';

import { useEffect } from 'react';
import ProductShowcase from './components/ProductShowcase'
import Navbar from './components/Navbar'
import LatencyMetrics from './components/LatencyMetrics'
import { useFingerprintODI } from './components/FingerprintProvider'

export default function Home() {
  // Get the browser data and sendToBackend function from context
  const { 
    browserData,
    backendData,
    processingPhase,
    sendToBackend
  } = useFingerprintODI();
  
  // Automatically send browser data to backend when it's available
  useEffect(() => {
    const sendData = async () => {
      // If we have browser data but no backend data yet, and we're in processing phase
      if (browserData && processingPhase === 'processing' && !backendData) {
        await sendToBackend(browserData);
      }
    };
    
    sendData();
  }, [browserData, processingPhase, backendData, sendToBackend]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Fingerprint Browser Collection Metrics</h2>
            <LatencyMetrics />
          </div>
        </div>
        <ProductShowcase />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Fingerprint 3DS Demo
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 