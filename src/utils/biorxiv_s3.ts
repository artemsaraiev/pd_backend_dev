/**
 * bioRxiv S3 Access Utility
 *
 * Accesses bioRxiv full-text content from their official S3 bucket.
 * Bucket: s3://biorxiv-src-monthly (requester pays)
 *
 * Required environment variables:
 *   AWS_ACCESS_KEY_ID - Your AWS access key
 *   AWS_SECRET_ACCESS_KEY - Your AWS secret key
 *   AWS_REGION - Should be "us-east-1" (where the bucket is located)
 */

// Simple in-memory cache for downloaded PDFs
const pdfCache = new Map<string, { data: Uint8Array; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse a bioRxiv DOI suffix to extract the date components.
 * DOI format: YYYY.MM.DD.NNNNNN (e.g., 2025.11.05.686879)
 */
function parseBiorxivDoi(doiSuffix: string): {
  year: number;
  month: number;
  day: number;
  id: string;
} | null {
  // Match pattern: YYYY.MM.DD.NNNNNN
  const match = doiSuffix.match(/^(\d{4})\.(\d{2})\.(\d{2})\.(\d+)$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
    id: match[4],
  };
}

/**
 * Get the month folder name for a given date.
 * e.g., November 2025 -> "November_2025"
 */
function getMonthFolderName(year: number, month: number): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${monthNames[month - 1]}_${year}`;
}

/**
 * Sign an AWS request using AWS Signature Version 4.
 * This is a simplified implementation for S3 GET requests.
 */
async function signAwsRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string,
): Promise<Record<string, string>> {
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  // Add required headers
  headers["x-amz-date"] = amzDate;
  headers["host"] = url.host;
  // Required for requester-pays bucket
  headers["x-amz-request-payer"] = "requester";
  // Required for S3 - hash of empty payload for GET requests
  const payloadHash = await sha256("");
  headers["x-amz-content-sha256"] = payloadHash;

  // Create canonical request
  // For S3, URI must be URI-encoded (but / is not encoded)
  const canonicalUri = url.pathname || "/";
  
  // Query string must be sorted and properly encoded
  const params = Array.from(url.searchParams.entries());
  params.sort((a, b) => a[0].localeCompare(b[0]));
  const canonicalQueryString = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(";");

  const canonicalHeaders = Object.keys(headers)
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .sort()
    .join("\n") + "\n";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  // Calculate signature
  const kDate = await hmacSha256(
    new TextEncoder().encode(`AWS4${secretAccessKey}`),
    dateStamp,
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = await hmacSha256Hex(kSigning, stringToSign);

  // Create authorization header
  headers["Authorization"] =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: Uint8Array,
  message: string,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(signature);
}

async function hmacSha256Hex(
  key: Uint8Array,
  message: string,
): Promise<string> {
  const sig = await hmacSha256(key, message);
  return Array.from(sig)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * List objects in the S3 bucket with a given prefix.
 */
async function listS3Objects(
  bucket: string,
  prefix: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
): Promise<string[]> {
  // Use path-style URL for requester-pays bucket
  const url = new URL(
    `https://s3.${region}.amazonaws.com/${bucket}`,
  );
  url.searchParams.set("list-type", "2");
  url.searchParams.set("prefix", prefix);

  const headers = await signAwsRequest(
    "GET",
    url,
    {},
    accessKeyId,
    secretAccessKey,
    region,
    "s3",
  );

  console.log(`[bioRxiv S3] Listing objects with prefix: ${prefix}`);
  console.log(`[bioRxiv S3] Request URL: ${url.toString()}`);

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[bioRxiv S3] S3 list error response: ${errorText}`);
    throw new Error(`S3 list failed: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const xml = await response.text();
  console.log(`[bioRxiv S3] S3 response (first 500 chars): ${xml.substring(0, 500)}`);
  
  // Simple XML parsing for Key elements
  const keys: string[] = [];
  const keyMatches = xml.matchAll(/<Key>([^<]+)<\/Key>/g);
  for (const match of keyMatches) {
    keys.push(match[1]);
  }
  console.log(`[bioRxiv S3] Found ${keys.length} objects`);
  return keys;
}

/**
 * Download an object from S3.
 */
async function downloadS3Object(
  bucket: string,
  key: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
): Promise<Uint8Array> {
  // Use path-style URL - key needs proper encoding for path segments
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const url = new URL(
    `https://s3.${region}.amazonaws.com/${bucket}/${encodedKey}`,
  );

  const headers = await signAwsRequest(
    "GET",
    url,
    {},
    accessKeyId,
    secretAccessKey,
    region,
    "s3",
  );

  console.log(`[bioRxiv S3] Downloading: ${key}`);

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[bioRxiv S3] S3 download error: ${errorText}`);
    throw new Error(`S3 download failed: ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Extract a PDF from a MECA zip file.
 * MECA files contain a "content" folder with the PDF.
 */
async function extractPdfFromMeca(mecaData: Uint8Array): Promise<Uint8Array> {
  // Use Deno's built-in zip handling or a simple approach
  // MECA files are standard ZIP files

  // For now, we'll use a simple approach: find the PDF signature in the zip
  // and extract it. A more robust solution would use a proper ZIP library.

  // Actually, let's use the Web Streams API to handle this
  // We need to find the PDF file in the ZIP

  // Simple ZIP parsing - find local file headers and extract PDF
  const view = new DataView(mecaData.buffer);
  let offset = 0;

  while (offset < mecaData.length - 4) {
    // Look for local file header signature: 0x04034b50
    if (view.getUint32(offset, true) === 0x04034b50) {
      const nameLength = view.getUint16(offset + 26, true);
      const extraLength = view.getUint16(offset + 28, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const compressionMethod = view.getUint16(offset + 8, true);

      const nameStart = offset + 30;
      const nameBytes = mecaData.slice(nameStart, nameStart + nameLength);
      const fileName = new TextDecoder().decode(nameBytes);

      const dataStart = nameStart + nameLength + extraLength;

      // Check if this is a PDF file in the content folder
      if (fileName.endsWith(".pdf") && fileName.includes("content/")) {
        if (compressionMethod === 0) {
          // Stored (no compression)
          return mecaData.slice(dataStart, dataStart + compressedSize);
        } else if (compressionMethod === 8) {
          // Deflate compression - use DecompressionStream
          const compressedData = mecaData.slice(
            dataStart,
            dataStart + compressedSize,
          );
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(compressedData);
              controller.close();
            },
          });
          const decompressed = stream.pipeThrough(
            new DecompressionStream("deflate-raw"),
          );
          const reader = decompressed.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          // Concatenate chunks
          const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
          const result = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          return result;
        }
      }

      // Move to next entry
      offset = dataStart + compressedSize;
    } else {
      offset++;
    }
  }

  throw new Error("PDF not found in MECA package");
}

/**
 * Fetch a bioRxiv PDF from S3.
 *
 * @param doiSuffix - The DOI suffix (e.g., "2025.11.05.686879")
 * @returns Object with PDF data or error message
 */
export async function fetchBiorxivPdf(
  doiSuffix: string,
): Promise<{ data: Uint8Array } | { error: string }> {
  // Check cache first
  const cached = pdfCache.get(doiSuffix);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[bioRxiv S3] Cache hit for ${doiSuffix}`);
    return { data: cached.data };
  }

  // Get AWS credentials from environment
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const region = Deno.env.get("AWS_REGION") || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    console.error("[bioRxiv S3] AWS credentials not configured");
    return { error: "AWS credentials not configured" };
  }

  console.log(`[bioRxiv S3] Using credentials: ${accessKeyId.substring(0, 8)}...`);

  const parsed = parseBiorxivDoi(doiSuffix);
  if (!parsed) {
    console.error(`[bioRxiv S3] Invalid DOI suffix format: ${doiSuffix}`);
    return { error: `Invalid DOI suffix format: ${doiSuffix}` };
  }

  const bucket = "biorxiv-src-monthly";
  const monthFolder = getMonthFolderName(parsed.year, parsed.month);

  // Check if this is a recent paper that might not be in S3 yet
  const paperDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  const now = new Date();
  const nextMonth = new Date(parsed.year, parsed.month, 5); // ~5th of next month
  
  if (now < nextMonth) {
    console.log(`[bioRxiv S3] Paper from ${monthFolder} may not be in S3 yet (deposited early next month)`);
  }

  console.log(
    `[bioRxiv S3] Looking for paper in Current_Content/${monthFolder}/`,
  );

  try {
    // List objects in the month folder to find the MECA file
    // The file naming convention includes the DOI suffix
    const prefix = `Current_Content/${monthFolder}/`;
    const objects = await listS3Objects(
      bucket,
      prefix,
      accessKeyId,
      secretAccessKey,
      region,
    );

    // Find the MECA file for this paper
    // Files are named like: 10.1101_2025.11.05.686879.meca
    const mecaFileName = `10.1101_${doiSuffix}.meca`;
    const mecaKey = objects.find((key) => key.includes(mecaFileName));

    if (!mecaKey) {
      console.log(`[bioRxiv S3] MECA file not found for ${doiSuffix}`);
      if (objects.length > 0) {
        console.log(`[bioRxiv S3] Available files: ${objects.slice(0, 5).join(", ")}...`);
      } else {
        console.log(`[bioRxiv S3] No files found in ${prefix} - folder may not exist yet`);
      }
      
      // Check if paper is too recent
      if (now < nextMonth) {
        return { 
          error: `Paper from ${monthFolder} is not yet available in S3. bioRxiv deposits content monthly, typically completing in the first week of the following month.` 
        };
      }
      return { error: `PDF not found in bioRxiv S3 bucket` };
    }

    console.log(`[bioRxiv S3] Found MECA file: ${mecaKey}`);

    // Download the MECA file
    const mecaData = await downloadS3Object(
      bucket,
      mecaKey,
      accessKeyId,
      secretAccessKey,
      region,
    );

    console.log(`[bioRxiv S3] Downloaded MECA file: ${mecaData.length} bytes`);

    // Extract the PDF
    const pdfData = await extractPdfFromMeca(mecaData);

    console.log(`[bioRxiv S3] Extracted PDF: ${pdfData.length} bytes`);

    // Cache it
    pdfCache.set(doiSuffix, { data: pdfData, timestamp: Date.now() });

    return { data: pdfData };
  } catch (error) {
    console.error(`[bioRxiv S3] Error fetching PDF:`, error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Check if AWS credentials are configured.
 */
export function isAwsConfigured(): boolean {
  return !!(
    Deno.env.get("AWS_ACCESS_KEY_ID") && Deno.env.get("AWS_SECRET_ACCESS_KEY")
  );
}

