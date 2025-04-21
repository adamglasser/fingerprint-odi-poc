'use client';

import { useEffect } from 'react';
import { useFingerprintODI } from './FingerprintProvider';

export default function LatencyMetrics() {
  const { 
    collectLatency,
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
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-mono text-xs">
                ✓ Signal collection completed in {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
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
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-mono text-xs">
                ✓ Signal collection completed in {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
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
          <div className="flex-1">
            <p className="text-sm text-green-700">
              <span className="font-mono text-xs">
                ✓ Browser signal collection: {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-green-700">
              <span className="font-mono text-xs">
                ✓ Backend storage: {storageLatency ? `${storageLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
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
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-mono text-xs">
                ✓ Browser signal collection: {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-mono text-xs">
                ✓ Backend storage: {storageLatency ? `${storageLatency.toFixed(2)}ms` : 'N/A'}
              </span>
            </p>
          </div>
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
        <div className="flex-1">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">Browser signal collection:</span>{' '}
            <span className="font-mono text-xs">
              {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
            </span>
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">Backend data storage:</span>{' '}
            <span className="font-mono text-xs">
              {storageLatency ? `${storageLatency.toFixed(2)}ms` : 'N/A'}
            </span>
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">Fingerprint identification:</span>{' '}
            <span className="font-mono text-xs">
              {identificationLatency ? `${identificationLatency.toFixed(2)}ms` : 'N/A'}
            </span>
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-indigo-700 font-semibold">
            <span className="font-medium">Total end-to-end latency:</span>{' '}
            <span className="font-mono text-xs">
              {collectLatency && backendLatency ? `${(collectLatency + backendLatency).toFixed(2)}ms` : 'N/A'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}