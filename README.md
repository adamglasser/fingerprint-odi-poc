# Fingerprint On-Demand Identification (ODI) Implementation

This project demonstrates a practical implementation of Fingerprint's On-Demand Identification (ODI) pattern using Next.js. The implementation follows Fingerprint's recommended approach of "collect now, send later" to improve performance and control over the identification flow.

## Architecture Overview

The implementation follows these key steps:

1. **Browser Signal Collection**: Collect browser signals on all pages using Fingerprint's `collect()` method
2. **Backend Storage**: Send collected signals to our backend server without calling Fingerprint's `/send` endpoint
3. **Identification on Checkout**: Only complete the full identification process (call `/send` and handle agent data) when the user reaches the checkout page

This approach provides:
- Faster loading times across most pages (no waiting for full identification)
- Complete control over when to perform full identification
- Better UX by showing transparent latency metrics throughout the process

## Component Structure

### FingerprintProvider

The core of the implementation is the [`FingerprintProvider`](app/components/FingerprintProvider.jsx) (in `app/components/FingerprintProvider.jsx`), which:

- Initializes the Fingerprint static agent
- Manages browser data collection
- Provides functions for sending data to backend and completing identification
- Exposes all functionality through React context
- Tracks and displays detailed latency metrics

### Key States

The provider maintains several important states:

- `browserData`: Raw data from the `collect()` method
- `processingPhase`: Current stage in the identification flow (initial → collecting → processing → sending → stored → identifying → complete)
- `latency`: Browser-side signal collection time
- `storageLatency`: Time to store data on our backend
- `identificationLatency`: Time to complete the Fingerprint identification
- `backendLatency`: Total backend processing time (storage + identification)
- `visitorId`: The final Fingerprint visitor ID

## Data Flow and Key Functions

### 1. Signal Collection

The collection process is handled by two main functions:

**Function: [`collectAndStoreData()`](app/components/FingerprintProvider.jsx#L48-L85)**

This shared function:
- Takes a Fingerprint instance and calls its `collect()` method
- Measures and stores collection latency
- Sets `processingPhase` to 'processing'
- Stores the data in `sessionStorage` for persistence

**Function: [`collectBrowserData()`](app/components/FingerprintProvider.jsx#L128-L130)**

This wrapper function:
- Uses the existing Fingerprint instance with the shared collection function
- Exposed through the context for components to trigger collection

Collection happens automatically when:
- The application first loads via the `loadFpAndCollect()` function
- The user manually resets the environment

### 2. Backend Data Storage

**Function: [`sendToBackend()`](app/components/FingerprintProvider.jsx#L167-L200)**

This function:
- Takes the browser data and sends it to our [`/api/store-fingerprint`](app/api/store-fingerprint/route.js) endpoint
- Measures and stores storage latency
- Sets `processingPhase` to 'stored'
- Stores data in `sessionStorage`

Triggered:
- Automatically on the homepage when browser data is available (see [`app/page.js`](app/page.js))
- When the checkout page loads, if data hasn't been sent yet

### 3. Complete Identification

**Function: [`completeIdentification()`](app/components/FingerprintProvider.jsx#L221-L258)**

This function:
- Takes previously stored backend data and sends it to our [`/api/send-fingerprint`](app/api/send-fingerprint/route.js) endpoint 
- Our backend then calls Fingerprint's `/send` endpoint to complete identification
- Handles the `agentData` returned from Fingerprint
- Measures and stores identification latency
- Updates total backend latency
- Sets `processingPhase` to 'complete'

Only triggered:
- When the user reaches the checkout page (see [`app/checkout/page.js`](app/checkout/page.js))

## API Routes

The implementation includes two critical API routes:

### 1. [`/api/store-fingerprint`](app/api/store-fingerprint/route.js)

This endpoint:
- Receives browser data from the frontend
- Extracts necessary HTTP headers and client information
- Stores the data for later use
- Returns storage metrics without calling Fingerprint

### 2. [`/api/send-fingerprint`](app/api/send-fingerprint/route.js)

This endpoint:
- Receives either direct browser data or previously stored backend data
- Prepares the payload for Fingerprint's `/send` endpoint
- Calls the `/send` endpoint with the required data
- Returns the visitor ID, agent data, and other Fingerprint information

The endpoint accepts two possible input structures:
1. Direct fingerprint data submission:
```javascript
{
  "fingerprintData": { /* Browser data collected by FingerprintJS */ }
}
```

2. Backend data from previous collection:
```javascript
{
  "backendData": {
    "collectedData": {
      "fingerprintData": { /* Browser data collected by FingerprintJS */ },
      "clientIP": "user's IP address",
      "clientHost": "request host",
      "clientUserAgent": "user agent string",
      "clientCookie": "optional Fingerprint cookie",
      "clientHeaders": { /* All request headers */ }
    },
    "backendLatency": 123 // Previous backend processing time in ms
  }
}
```

The `backendData` parameter is crucial for the ODI pattern as it:
- Allows storage of previously collected fingerprint data
- Preserves the user's request metadata (IP, headers, etc.)
- Tracks cumulative backend processing time across the identification flow
- Enables deferred identification at the optimal moment (e.g., checkout)

When using the `backendData` approach, identification can be split into two phases:
1. Initial data collection and storage (via `/api/store-fingerprint`)
2. Completing identification (via `/api/send-fingerprint` with `backendData`)


## Metrics Display

The [`LatencyMetrics`](app/components/LatencyMetrics.jsx) component provides a view into the identification process:

- Shows the current processing phase
- Displays detailed timing information for each step
- Explains what will happen next in the process
- Shows a complete timing breakdown after identification is complete

## Implementation Details

### Static Agent Installation

The project uses Fingerprint's static agent installation with version 3.12.0 (beta) as required for ODI:

```javascript
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro-static';

// Load the agent with required modules
const fp = await FingerprintJS.load({
  apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY,
  region: "us",
  modules: [
    FingerprintJS.makeIdentificationModule(),
    FingerprintJS.makeBotdModule(),
    FingerprintJS.makeLatencyReportModule(),
  ],
});

// Collect browser signals
const browserData = await fp.collect();
```

### Handling Agent Data

When identification is complete, the application properly handles the agent data to maintain identification accuracy:

```javascript
// After receiving data from the /send endpoint
if (data.agentData && fpInstance) {
  await FingerprintJS.handleAgentData(data.agentData);
}
```

## Session Persistence

Browser data and metrics are stored in `sessionStorage` to ensure persistence across page navigation, including:

- Browser data collection results
- Collection latency
- Backend storage latency  
- Identification latency
- Current processing phase
- Visitor ID

## Usage Example

The implementation demonstrates how to use Fingerprint ODI in a real application flow:

1. **Homepage Load**: Browser signals are collected and sent to backend storage
2. **Product Browsing**: User can view products while data is already collected
3. **Checkout**: When the user decides to checkout, full identification is performed
4. **Payment**: After identification completes, the payment form is ready with fraud protection

## Reset Functionality

The application includes a [reset mechanism](app/components/FingerprintProvider.jsx#L296-L343) to:
- Clear all cookies
- Remove session storage data
- Reset all state
- Re-collect browser signals

This is useful for testing different scenarios and demonstrating the full flow.

## References

- [Fingerprint On-Demand Identification](https://dev.fingerprint.com/docs/on-demand-identification)
- [Fingerprint Static Agent Installation](https://dev.fingerprint.com/docs/js-agent-static#installation)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

