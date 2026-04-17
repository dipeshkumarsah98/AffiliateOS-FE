// lib/storage.ts
import { randomUUID, createHash } from "crypto";
// For S3 adapter
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type PutParams = {
  originalName: string;
  contentType: string;
  bytes: Buffer;
};

export type StoredFile = {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  url?: string; // public URL if available
  inlineBytes?: Buffer;
  checksumSha256: string;
  meta?: Record<string, string>;
};

export interface StorageAdapter {
  put(p: PutParams): Promise<StoredFile>;
}
