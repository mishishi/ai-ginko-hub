import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from '../test/helpers.js';
import { seedTestProjects } from '../test/setup.js';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn().mockResolvedValue({}) })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-url'),
}));

let app: Awaited<ReturnType<typeof buildTestApp>>;
beforeEach(async () => {
  app = await buildTestApp();
  await seedTestProjects();
});

async function getAuthToken(): Promise<string> {
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'testadmin', password: 'testpass123' },
  });
  const setCookie = loginRes.headers['set-cookie'];
  const cookieStr = Array.isArray(setCookie) ? setCookie.join() : String(setCookie);
  const tokenMatch = cookieStr.match(/admin_token=([^;]+)/);
  return tokenMatch![1];
}

describe('Upload API', () => {
  // POST /api/upload returns presigned URL with auth
  it('returns presigned URL with auth', async () => {
    const token = await getAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      headers: { authorization: `Bearer ${token}` },
      payload: { filename: 'test.png', contentType: 'image/png' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.presignedUrl).toBe('https://mock-url');
    expect(body.key).toMatch(/^uploads\/\d+-test\.png$/);
  });

  // POST /api/upload returns 401 without auth
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      payload: { filename: 'test.png', contentType: 'image/png' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  // POST /api/upload validates filename (rejects path traversal)
  it('rejects path traversal in filename', async () => {
    const token = await getAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      headers: { authorization: `Bearer ${token}` },
      payload: { filename: 'uploads/..', contentType: 'image/png' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('invalid filename');
  });

  // POST /api/upload validates content-type (rejects non-image)
  it('rejects non-image content type', async () => {
    const token = await getAuthToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/upload',
      headers: { authorization: `Bearer ${token}` },
      payload: { filename: 'test.txt', contentType: 'text/plain' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('unsupported content type');
  });

  // DELETE /api/upload returns 204 with auth
  it('returns 204 with auth', async () => {
    const token = await getAuthToken();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/upload',
      headers: { authorization: `Bearer ${token}` },
      payload: { key: 'uploads/1234567890-test.png' },
    });
    expect(res.statusCode).toBe(204);
  });

  // DELETE /api/upload returns 401 without auth
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/upload',
      payload: { key: 'uploads/1234567890-test.png' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });
});
