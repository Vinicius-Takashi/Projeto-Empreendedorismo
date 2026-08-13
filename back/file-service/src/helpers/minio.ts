import { Client } from 'minio';
import config from '@app/config';

const minioClient = new Client({
  endPoint: config.minioEndpoint,
  port: config.minioPort,
  useSSL: config.minioUseSSL,
  accessKey: config.minioAccessKey,
  secretKey: config.minioSecretKey,
});

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(config.minioBucket);

  if (!exists) {
    await minioClient.makeBucket(config.minioBucket);
  }
}

export async function uploadPdf(objectKey: string, buffer: Buffer) {
  await ensureBucket();
  await minioClient.putObject(config.minioBucket, objectKey, buffer, buffer.length, {
    'Content-Type': 'application/pdf',
  });
}

export async function createDownloadUrl(objectKey: string) {
  return minioClient.presignedGetObject(
    config.minioBucket,
    objectKey,
    config.downloadUrlExpirationSeconds,
  );
}
