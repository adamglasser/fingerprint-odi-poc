/**
 * Validates if a string is a valid IPv4 or IPv6 address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - true if valid IP, false otherwise
 */
export function isValidIP(ip) {
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

/**
 * Extracts and validates client IP from request headers
 * @param {Headers} headers - Request headers
 * @returns {string} - Valid IP address or fallback IP
 */
export function extractClientIP(headers) {
  // Extract IP from headers
  let clientIP = headers['x-forwarded-for'] || headers.get?.('x-real-ip');
  
  // If x-forwarded-for contains multiple IPs, take the first one (client's original IP)
  if (clientIP && clientIP.includes(',')) {
    clientIP = clientIP.split(',')[0].trim();
  }
  
  // Ensure we have a valid IP
  if (!clientIP || !isValidIP(clientIP)) {
    // For testing/development - use a valid public IP
    clientIP = '8.8.8.8';
    console.log('Using fallback IP address');
  }
  
  return clientIP;
} 