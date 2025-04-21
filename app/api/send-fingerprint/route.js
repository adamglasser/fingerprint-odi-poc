import { extractClientIP } from '../../utils/ipValidation';

export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { fingerprintData, backendData } = body;
    
    // Use either direct fingerprintData or extract it from backendData
    let fpData, clientIP, clientHost, clientUserAgent, clientCookie, clientHeaders;
    
    if (backendData && backendData.collectedData) {
      // Extract from previously collected data
      const collected = backendData.collectedData;
      fpData = collected.fingerprintData;
      clientIP = collected.clientIP;
      clientHost = collected.clientHost;
      clientUserAgent = collected.clientUserAgent;
      clientCookie = collected.clientCookie;
      clientHeaders = collected.clientHeaders;
    } else if (fingerprintData) {
      // Direct data from request
      fpData = fingerprintData;
      
      // Extract the required HTTP headers from the request
      clientHeaders = Object.fromEntries(request.headers.entries());
      
      // Extract and validate client IP using the shared utility
      clientIP = extractClientIP(clientHeaders);
      
      clientHost = clientHeaders['host'] || 'localhost';
      clientUserAgent = clientHeaders['user-agent'] || '';
      clientCookie = clientHeaders['cookie']?.match(/_iidt=([^;]+)/)?.[1] || null;
    } else {
      return Response.json({ error: 'Missing fingerprint data or backend data' }, { status: 400 });
    }
    
    // Log the time for latency measurement
    const backendStartTime = performance.now();
    
    // Prepare the payload for Fingerprint's /send endpoint
    const sendPayload = {
      fingerprintData: fpData,
      clientIP,
      clientHost,
      clientUserAgent,
      ...(clientCookie && { clientCookie }),
      clientHeaders
    };
    
    // Get API key from environment or use a placeholder
    const apiKey = process.env.FINGERPRINT_API_KEY || process.env.NEXT_PUBLIC_FINGERPRINT_SECRET_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Fingerprint API key');
      return Response.json({ error: 'Configuration error: Missing API key' }, { status: 500 });
    }
    
    // Call Fingerprint's /send endpoint
    const fpResponse = await fetch('https://api.fpjs.io/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-API-Key': apiKey
      },
      body: JSON.stringify(sendPayload)
    });
    
    if (!fpResponse.ok) {
      const errorText = await fpResponse.text();
      throw new Error(`Fingerprint API error: ${fpResponse.status}, ${errorText}`);
    }
    
    // Get the response and extract necessary data
    const fpResponseData = await fpResponse.json();
    
    // Calculate backend latency
    const backendLatency = performance.now() - backendStartTime;
    
    // Add previous backend latency if it exists
    const totalBackendLatency = (backendData?.backendLatency || 0) + backendLatency;
    
    // Extract Set-Cookie headers from the Fingerprint response
    const fpCookies = fpResponse.headers.getSetCookie?.() || [];
    
    // Create a response with the necessary data and cookies
    const response = Response.json({
      success: true,
      visitorId: fpResponseData.products?.identification?.data?.visitorId,
      agentData: fpResponseData.agentData,
      backendLatency: totalBackendLatency,
      botd: fpResponseData.products?.botd?.data,
      requestId: fpResponseData.requestId
    });
    
    // Add cookies from Fingerprint to our response
    fpCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
    
    return response;
  } catch (error) {
    console.error('Fingerprint API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 