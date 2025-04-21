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