import { detectContentType } from "./mime";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword",
];

export async function validateFile(file: File) {
  if (file.size === 0) throw new Error(`File "${file.name}" is empty.`);
  if (file.size > MAX_FILE_BYTES)
    throw new Error(
      `File "${file.name}" exceeds ${MAX_FILE_BYTES / (1024 * 1024)}MB limit.`,
    );

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = await detectContentType(buf, file.type);

  if (!ALLOWED_MIME.includes(detected)) {
    throw new Error(`File "${file.name}" type not allowed: ${detected}`);
  }

  return { buf, mime: detected };
}
