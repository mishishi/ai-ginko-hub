import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestApp } from '../test/helpers.js';
import { seedTestProjects } from '../test/setup.js';

let app: Awaited<ReturnType<typeof buildTestApp>>;
beforeEach(async () => {
  app = await buildTestApp();
  await seedTestProjects();
});

describe('Auth API', () => {
  // POST /api/auth/login with valid credentials returns 200 and sets cookie
  it('login with valid credentials returns 200 and sets cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testadmin', password: 'testpass123' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.username).toBe('testadmin');
    // Cookie should be set
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie) ? setCookie.join() : String(setCookie)).toContain('admin_token');
  });

  // POST /api/auth/login with invalid credentials returns 401
  it('login with invalid credentials returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testadmin', password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid credentials');
  });

  // POST /api/auth/login with non-existent user returns 401
  it('login with non-existent user returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nonexistent', password: 'testpass123' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid credentials');
  });

  // GET /api/auth/me returns username when valid JWT provided
  it('me returns username when valid JWT provided', async () => {
    // First login to get the token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testadmin', password: 'testpass123' },
    });
    expect(loginRes.statusCode).toBe(200);

    // Extract token from cookie
    const setCookie = loginRes.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join() : String(setCookie);
    const tokenMatch = cookieStr.match(/admin_token=([^;]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    // Call /api/auth/me with the token
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.statusCode).toBe(200);
    const body = JSON.parse(meRes.body);
    expect(body.username).toBe('testadmin');
  });

  // GET /api/auth/me returns 401 without auth
  it('me returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  // POST /api/auth/logout clears cookie
  it('logout clears cookie', async () => {
    // First login to get the token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testadmin', password: 'testpass123' },
    });
    expect(loginRes.statusCode).toBe(200);

    // Extract token from cookie
    const setCookie = loginRes.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join() : String(setCookie);
    const tokenMatch = cookieStr.match(/admin_token=([^;]+)/);
    const token = tokenMatch![1];

    // Call logout
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: `admin_token=${token}` },
    });
    expect(logoutRes.statusCode).toBe(200);

    // Cookie should be cleared
    const logoutCookie = logoutRes.headers['set-cookie'];
    expect(logoutCookie).toBeDefined();
    const cookieStr2 = Array.isArray(logoutCookie) ? logoutCookie.join() : String(logoutCookie);
    // Clear cookie has maxAge=0 or similar
    expect(cookieStr2).toMatch(/admin_token=;/);
  });
});
