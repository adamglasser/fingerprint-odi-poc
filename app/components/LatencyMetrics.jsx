'use client';

import { useState, useEffect } from 'react';
import { useFingerprintODI } from './FingerprintProvider';

export default function LatencyMetrics({ phase }) {
  const { 
    latency: collectLatency, 
    backendLatency,
    backendData,
    processingPhase,
    isLoading,
    error
  } = useFingerprintODI();

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
        <div className="flex">
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Processing...</span>{' '}
              <span className="font-mono text-xs">
                Collection completed in {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
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

  // Complete phase with metrics
  return (
    <div className="rounded-md bg-indigo-50 p-4 mb-4">
      <div className="flex flex-col gap-2">
        <div className="flex-1">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">Collection latency:</span>{' '}
            <span className="font-mono text-xs">
              {collectLatency ? `${collectLatency.toFixed(2)}ms` : 'N/A'}
            </span>
          </p>
        </div>
        {backendLatency && (
          <>
            <div className="flex-1">
              <p className="text-sm text-indigo-700">
                <span className="font-medium">Backend processing latency:</span>{' '}
                <span className="font-mono text-xs">
                  {backendLatency ? `${backendLatency.toFixed(2)}ms` : 'N/A'}
                </span>
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-indigo-700 font-semibold">
                <span className="font-medium">Total latency:</span>{' '}
                <span className="font-mono text-xs">
                  {collectLatency && backendLatency ? `${(collectLatency + backendLatency).toFixed(2)}ms` : 'N/A'}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 