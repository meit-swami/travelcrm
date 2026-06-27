import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../config';

/**
 * S3-compatible object storage. Files are private; access is granted via
 * time-limited signed URLs only (never public buckets). Works with AWS S3 and
 * MinIO (dev) via S3_ENDPOINT + path-style addressing.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: AppConfigService) {
    this.bucket = config.get('S3_BUCKET');
    const endpoint = config.get('S3_ENDPOINT');
    const accessKeyId = config.get('S3_ACCESS_KEY');
    const secretAccessKey = config.get('S3_SECRET_KEY');

    this.client = new S3Client({
      region: config.get('S3_REGION'),
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  /** Build a tenant-namespaced object key. */
  buildKey(tenantId: string, category: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${tenantId}/${category}/${Date.now()}-${safe}`;
  }

  async putObject(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** Presigned URL for downloading a private object. */
  async getDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  /** Presigned URL for a direct browser upload. */
  async getUploadUrl(key: string, contentType: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
