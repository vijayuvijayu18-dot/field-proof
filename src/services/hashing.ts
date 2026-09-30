/**
 * Cryptographic Integrity Service
 * Computes tamper-evident SHA-256 digests using standard Web Crypto API.
 * 
 * Note: Cryptographic hashing verifies data and digital image integrity.
 * It does not certify the scientific or chemical correctness of the test.
 */

export async function computeSha256FromBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSha256FromDataUrl(dataUrl: string): Promise<string> {
  // Convert base64 data URL to ArrayBuffer for exact binary hashing
  const base64Parts = dataUrl.split(',');
  const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return computeSha256FromBuffer(bytes.buffer);
}

export async function computeSha256FromString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return computeSha256FromBuffer(data.buffer);
}

export async function verifyImageIntegrity(
  currentImageDataUrl: string,
  expectedHash: string
): Promise<{ matched: boolean; calculatedHash: string; algorithm: 'SHA-256' }> {
  const calculatedHash = await computeSha256FromDataUrl(currentImageDataUrl);
  const matched = calculatedHash.toLowerCase() === expectedHash.toLowerCase();
  return {
    matched,
    calculatedHash,
    algorithm: 'SHA-256'
  };
}
