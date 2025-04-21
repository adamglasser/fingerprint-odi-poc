'use client';

import { useEffect } from 'react';
import { useFingerprintODI } from './FingerprintProvider';

export default function LatencyMetrics() {
  const { 
    collectLatency,
    loadLatency,
    totalLatency,
    backendLatency,
    storageLatency,
    identificationLatency,
    processingPhase,
    isLoading,
    error,
    registerResetCallback
  } = useFingerprintODI();

  // Register a reset callback to ensure the component updates when environment resets
  useEffect(() => {
    if (registerResetCallback) {
      return registerResetCallback(() => {
        // This callback forces a re-render by updating internal state
        // No code needed here as the reset is handled by the provider
      });
    }
  }, [registerResetCallback]);

  // Helper function to get progress percentage based on phase
  const getProgressPercentage = (phase) => {
    switch (phase) {
      case 'initial':
        return 0;
      case 'initializing':
        return 10;
      case 'collecting':
        return 20;
      case 'processing':
        return 40;
      case 'sending':
        return 60;
      case 'stored':
        return 80;
      case 'identifying':
        return 90;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  if (processingPhase === 'initial' || isLoading) {
    return (
      <div className="rounded-md bg-blue-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Initializing...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (processingPhase === 'collecting') {
    return (
      <div className="rounded-md bg-blue-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Collecting browser signals...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (processingPhase === 'processing') {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Browser signals collected</span>
            </p>
          </div>
          {loadLatency && (
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-mono text-xs">
                  ✓ Agent load time: {loadLatency.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
          {collectLatency && (
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-mono text-xs">
                  ✓ Signal collection: {collectLatency.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-mono text-xs">
                Waiting to send data to backend...
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (processingPhase === 'sending') {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Sending to backend...</span>
            </p>
          </div>
          {loadLatency && collectLatency && (
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-mono text-xs">
                  ✓ Browser processing: {(loadLatency + collectLatency).toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (processingPhase === 'stored') {
    return (
      <div className="rounded-md bg-green-50 p-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex-1">
            <p className="text-sm text-green-700">
              <span className="font-medium">Data stored on backend</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="w-full bg-green-100 rounded-full h-1.5 mb-2">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${getProgressPercentage(processingPhase)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-green-600 mb-4">
              <span>Collection</span>
              <span>Storage</span>
              <span>Identification</span>
            </div>
          </div>

          {collectLatency && (
            <div className="flex-1">
              <p className="text-sm text-green-700">
                <span className="font-mono text-xs">
                  ✓ Signal collection: {collectLatency.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}

          {storageLatency && (
            <div className="flex-1">
              <p className="text-sm text-green-700">
                <span className="font-mono text-xs">
                  ✓ Backend storage: {storageLatency.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-green-700 italic">
              <span className="font-mono text-xs">
                Fingerprint identification will be completed on checkout
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (processingPhase === 'identifying') {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Completing identification...</span>
            </p>
          </div>
          {loadLatency && collectLatency && (
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-mono text-xs">
                  ✓ Browser processing: {(loadLatency + collectLatency).toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
          {storageLatency && (
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-mono text-xs">
                  ✓ Backend storage: {storageLatency.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (processingPhase === 'error' || error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error:</span>{' '}
              <span className="font-mono text-xs break-all">
                {error?.message || 'Failed to process fingerprint data'}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Complete phase with metrics - this will be shown on checkout page
  return (
    <div className="rounded-md bg-indigo-50 p-4 mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex-1">
          <p className="text-sm text-indigo-700 font-medium">
            Fingerprint Identification Complete
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1">
          <div className="w-full bg-indigo-100 rounded-full h-1.5 mb-2">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ 
                width: `${getProgressPercentage(processingPhase)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-indigo-600 mb-4">
            <span>Collection</span>
            <span>Storage</span>
            <span>Identification</span>
          </div>
        </div>

        {loadLatency && (
          <div className="flex-1">
            <p className="text-sm text-indigo-700">
              <span className="font-medium">Agent load time:</span>{' '}
              <span className="font-mono text-xs">{loadLatency.toFixed(2)}ms</span>
            </p>
          </div>
        )}
        
        {collectLatency && (
          <div className="flex-1">
            <p className="text-sm text-indigo-700">
              <span className="font-medium">Signal collection:</span>{' '}
              <span className="font-mono text-xs">{collectLatency.toFixed(2)}ms</span>
            </p>
          </div>
        )}
        
        {storageLatency && (
          <div className="flex-1">
            <p className="text-sm text-indigo-700">
              <span className="font-medium">Backend storage:</span>{' '}
              <span className="font-mono text-xs">{storageLatency.toFixed(2)}ms</span>
            </p>
          </div>
        )}
        
        {identificationLatency && (
          <div className="flex-1">
            <p className="text-sm text-indigo-700">
              <span className="font-medium">Identification:</span>{' '}
              <span className="font-mono text-xs">{identificationLatency.toFixed(2)}ms</span>
            </p>
          </div>
        )}
        
        {totalLatency && (
          <div className="flex-1">
            <p className="text-sm text-indigo-700 font-semibold">
              <span className="font-medium">Total end-to-end:</span>{' '}
              <span className="font-mono text-xs">{totalLatency.toFixed(2)}ms</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}