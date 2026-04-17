// lib/storage-r2.ts
import { randomUUID, createHash } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StorageAdapter, PutParams, StoredFile } from "./storage";

export class R2Storage implements StorageAdapter {
  private client: S3Client;
  constructor(
    private opts: {
      accountId: string; // CF account ID
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      prefix?: string; // e.g., "uploads/"
    },
  ) {
    this.client = new S3Client({
      region: "auto", // R2 uses "auto"
      endpoint: `https://${opts.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async put(p: PutParams): Promise<StoredFile> {
    const id = randomUUID();
    const ext = (
      p.originalName.match(/\.[a-z0-9]+$/i)?.[0] ?? ""
    ).toLowerCase();
    const key = `${(this.opts.prefix ?? "").replace(/^\//, "")}${id}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        Body: p.bytes,
        ContentType: p.contentType,
      }),
    );

    const checksumSha256 = createHash("sha256").update(p.bytes).digest("hex");

    return {
      id,
      filename: key.split("/").pop()!,
      size: p.bytes.length,
      contentType: p.contentType,
      url: key, // Store the key as the URL for internal reference; the public URL can be constructed by the client if needed
      checksumSha256,
    };
  }
}
