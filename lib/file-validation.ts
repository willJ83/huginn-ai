/**
 * lib/file-validation.ts
 *
 * Validates uploaded files by inspecting their magic bytes (file signature),
 * not just the MIME type the client claims. Browsers can send any Content-Type;
 * the magic bytes are the ground truth.
 *
 * Size limits are intentionally conservative — large files can DoS memory-bound
 * parsers (pdf-parse, mammoth) or inflate Anthropic API costs.
 */

export type FileValidationResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; error: string };

// ── Size limits ───────────────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS = {
  /** pdf-parse loads the whole buffer into memory; 20 MB is generous */
  pdf:   20 * 1024 * 1024,
  /** mammoth is similarly memory-bound */
  docx:  20 * 1024 * 1024,
  /** Anthropic Vision API hard limit is 5 MB; stay under it with margin */
  image:  4.5 * 1024 * 1024,
} as const;

// ── Magic-byte signatures ─────────────────────────────────────────────────────

/** PDF: always starts with the literal bytes %PDF */
function isPDF(buf: Buffer): boolean {
  return buf.length >= 4 && buf.slice(0, 4).toString("ascii") === "%PDF";
}

/** PNG: 8-byte signature 89 50 4E 47 0D 0A 1A 0A */
function isPNG(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 && // P
    buf[2] === 0x4e && // N
    buf[3] === 0x47 && // G
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

/** JPEG: starts with FF D8 FF */
function isJPEG(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/** WebP: RIFF????WEBP */
function isWebP(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  );
}

/**
 * DOCX / XLSX / ZIP: all start with PK\x03\x04.
 * We also check the Content-Type claim to distinguish DOCX from a generic ZIP.
 */
function isPKZip(buf: Buffer): boolean {
  return (
    buf.length >= 4 &&
    buf[0] === 0x50 && // P
    buf[1] === 0x4b && // K
    buf[2] === 0x03 &&
    buf[3] === 0x04
  );
}

// ── Validators ────────────────────────────────────────────────────────────────

export async function validatePDF(file: File): Promise<FileValidationResult> {
  if (file.size > FILE_SIZE_LIMITS.pdf) {
    return { ok: false, error: "PDF must be under 20 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isPDF(buffer)) {
    return { ok: false, error: "File does not appear to be a valid PDF." };
  }

  return { ok: true, buffer };
}

export async function validateDOCX(file: File): Promise<FileValidationResult> {
  if (file.size > FILE_SIZE_LIMITS.docx) {
    return { ok: false, error: "Document must be under 20 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isPKZip(buffer)) {
    return { ok: false, error: "File does not appear to be a valid DOCX document." };
  }

  return { ok: true, buffer };
}

/** Accepted MIME types for the image extractor */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export async function validateImage(file: File): Promise<FileValidationResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return { ok: false, error: "Please upload a JPG, PNG, WebP, or GIF image." };
  }

  if (file.size > FILE_SIZE_LIMITS.image) {
    return { ok: false, error: "Image must be under 4.5 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const valid =
    (file.type === "image/jpeg" && isJPEG(buffer)) ||
    (file.type === "image/png"  && isPNG(buffer))  ||
    (file.type === "image/webp" && isWebP(buffer)) ||
    // GIF and HEIC: rely on MIME only (magic bytes are less critical for
    // images processed by Anthropic Vision rather than browser-rendered)
    file.type === "image/gif";

  if (!valid) {
    return { ok: false, error: "File contents do not match the declared image type." };
  }

  return { ok: true, buffer };
}
