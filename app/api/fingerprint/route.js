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
    
    // Extract and properly format the client IP
    let clientIP = headers['x-forwarded-for'] || request.headers.get('x-real-ip');
    // If x-forwarded-for contains multiple IPs, take the first one (client's original IP)
    if (clientIP && clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    
    // Validate IP format (basic validation)
    function isValidIP(ip) {
      // IPv4 validation
      const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      if (ipv4Pattern.test(ip)) {
        const parts = ip.split('.').map(part => parseInt(part, 10));
        return parts.every(part => part >= 0 && part <= 255);
      }
      
      // Basic IPv6 validation (simplified)
      const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv6Pattern.test(ip);
    }
    
    // Ensure we have a valid IP
    if (!clientIP || !isValidIP(clientIP)) {
      // For testing/development - use a valid public IP
      clientIP = '8.8.8.8';
      console.log('Using fallback IP address');
    }
    
    // Log the IP we're using
    console.log('Using client IP:', clientIP);
    
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