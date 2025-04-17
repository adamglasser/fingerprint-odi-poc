export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();
    const { fingerprintData } = body;
    
    if (!fingerprintData) {
      return Response.json({ error: 'Missing fingerprint data' }, { status: 400 });
    }
    
    // Log the time for latency measurement
    const backendStartTime = performance.now();
    
    // Extract the required HTTP headers from the request
    const headers = Object.fromEntries(request.headers.entries());
    const clientIP = headers['x-forwarded-for'] || '127.0.0.1'; // In production, ensure you get the actual client IP
    const clientHost = headers['host'] || 'localhost';
    const clientUserAgent = headers['user-agent'] || '';
    const clientCookie = headers['cookie']?.match(/_iidt=([^;]+)/)?.[1] || null;
    
    // Prepare the payload for Fingerprint's /send endpoint
    const sendPayload = {
      fingerprintData,
      clientIP,
      clientHost,
      clientUserAgent,
      ...(clientCookie && { clientCookie }),
      clientHeaders: headers
    };
    
    // Get API key from environment or use a placeholder
    // In production, store this in environment variables
    const apiKey = process.env.FINGERPRINT_API_KEY || 'your_secret_api_key_here';
    
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
    const fpData = await fpResponse.json();
    
    // Calculate backend latency
    const backendLatency = performance.now() - backendStartTime;
    
    // Extract Set-Cookie headers from the Fingerprint response
    const fpCookies = fpResponse.headers.getSetCookie?.() || [];
    
    // Create a response with the necessary data and cookies
    const response = Response.json({
      success: true,
      visitorId: fpData.products?.identification?.data?.visitorId,
      agentData: fpData.agentData,
      backendLatency,
      botd: fpData.products?.botd?.data,
      requestId: fpData.requestId
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