import type { FastifyInstance } from 'fastify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '../middleware/auth.js';

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
  });
}

// POST /api/upload — returns presigned PUT URL (auth required)
export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/upload', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = request.body as { filename: string; contentType: string };
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return reply.status(400).send({ error: 'filename and contentType required' });
    }

    // Sanitize filename: strip path components and reject path traversal
    const safeName = filename.replace(/^.*[/\\]/, '').replace(/\.\./g, '');
    if (!safeName || safeName !== filename.replace(/^.*[/\\]/, '')) {
      return reply.status(400).send({ error: 'invalid filename' });
    }

    // Validate content-type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return reply.status(400).send({ error: 'unsupported content type' });
    }

    const key = `uploads/${Date.now()}-${safeName}`;
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.CLOUDFLARE_BUCKET}.public.r2.cloudflarestorage.com/${key}`;

    return reply.send({ presignedUrl, publicUrl, key });
  });
}
