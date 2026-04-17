export async function detectContentType(
  buf: Buffer,
  fallback: string
): Promise<string> {
  if (buf.length >= 4) {
    const sig = buf.subarray(0, 12).toString("hex");

    if (sig.startsWith("255044462d")) return "application/pdf";

    if (sig.startsWith("89504e470d0a1a0a")) return "image/png";

    if (sig.startsWith("ffd8ff")) return "image/jpeg";

    const asStr = buf.toString("utf8", 0, 12);
    if (asStr.startsWith("RIFF") && buf.toString("utf8", 8, 12) === "WEBP")
      return "image/webp";

    if (sig.startsWith("504b0304")) {
      return "application/zip";
    }

    const ascii = buf.toString("utf8");
    const nonPrintable = ascii
      .split("")
      .filter(
        (c) =>
          c.charCodeAt(0) < 9 || (c.charCodeAt(0) > 13 && c.charCodeAt(0) < 32)
      ).length;
    if (nonPrintable < ascii.length * 0.01) return "text/plain";
  }
  return fallback || "application/octet-stream";
}
