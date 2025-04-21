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
    
    // Use Node.js built-in net module for IP validation
    const { isIP } = require('net');
    
    // Ensure we have a valid IP
    if (!clientIP || !isIP(clientIP)) {
      // For testing/development - use a valid public IP
      clientIP = '8.8.8.8';
      console.log('Using fallback IP address');
    }
    
    const clientHost = headers['host'] || 'localhost';
    const clientUserAgent = headers['user-agent'] || '';
    const clientCookie = headers['cookie']?.match(/_iidt=([^;]+)/)?.[1] || null;
    
    // Store the collected data (in a real implementation, you might want to save this to a database)
    const collectedData = {
      fingerprintData,
      clientIP,
      clientHost,
      clientUserAgent,
      clientCookie,
      clientHeaders: headers,
      timestamp: new Date().toISOString()
    };
    
    // Calculate backend latency
    const backendLatency = performance.now() - backendStartTime;
    
    // Return the collected data along with the backend latency
    return Response.json({
      success: true,
      collectedData,
      backendLatency
    });
  } catch (error) {
    console.error('Error storing fingerprint data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 