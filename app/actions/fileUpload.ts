"use server";

import { StoredFile } from "@/lib/storage";
import { ZodError } from "zod";
import { R2Storage } from "@/lib/storage-r2";

export async function fileUpload(formData: FormData): Promise<{
  ok: boolean;
  stored?: StoredFile;
  message?: string;
}> {
  try {
    // Extract the file from FormData
    const file = formData.get("file") as File;

    if (!file) {
      return {
        ok: false,
        message: "No file provided",
      };
    }

    // Validate file type (images only)
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      return {
        ok: false,
        message:
          "Invalid file type. Please upload an image (JPEG, PNG, or WebP)",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        ok: false,
        message: "File too large. Maximum size is 5MB",
      };
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize R2 storage
    const storage = new R2Storage({
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET!,
      prefix: process.env.R2_PREFIX || "uploads/",
    });

    // Upload to R2
    const stored = await storage.put({
      originalName: file.name,
      contentType: file.type,
      bytes: buffer,
    });

    return { ok: true, stored };
  } catch (err: any) {
    console.error("File upload error:", err);

    if (err instanceof ZodError) {
      return {
        ok: false,
        message: err.errors[0].message || "Validation error",
      };
    }

    return {
      ok: false,
      message: err?.message || "Failed to upload file. Please try again.",
    };
  }
}
