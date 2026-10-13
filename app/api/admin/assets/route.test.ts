import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { mkdir, readFile, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { POST } from './route';
import { getCurrentAdmin } from '../../../../lib/cms-auth';
import { MAX_IMAGE_BYTES } from '../../../../lib/image-constants';

vi.mock('../../../../lib/cms-auth', () => ({
  getCurrentAdmin: vi.fn(),
}));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn(actual.mkdir),
    rename: vi.fn(actual.rename),
    rm: vi.fn(actual.rm),
    writeFile: vi.fn(actual.writeFile),
  };
});

const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');
const existingAssets = new Set<string>();

function makeRequest(file: File, destination = 'gallery') {
  const form = new FormData();
  form.append('file', file);
  form.append('destination', destination);
  return new Request('http://localhost/api/admin/assets', { method: 'POST', body: form });
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockResolvedValue({
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    canManagePosts: true,
    canManageSettings: true,
    canManageAccess: true,
    isActive: true,
    mustChangePassword: false,
    lastAccessAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return mkdir(uploadDirectory, { recursive: true });
});

afterEach(async () => {
  for (const fileName of existingAssets) {
    await rm(path.join(uploadDirectory, fileName), { force: true });
  }
  existingAssets.clear();
});

describe('POST /api/admin/assets', () => {
  it('rejects a file above 2 MiB before image processing', async () => {
    const oversized = new File([Buffer.alloc(2 * 1024 * 1024 + 1)], 'photo.jpg', { type: 'image/jpeg' });
    const response = await POST(makeRequest(oversized));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/2 MB/i) });
  });

  it('rejects oversized multipart bodies before parsing their fields', async () => {
    const request = new Request('http://localhost/api/admin/assets', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=unused',
        'content-length': String(MAX_IMAGE_BYTES + 64 * 1024 + 1),
      },
      body: 'ignored',
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/limite de 2 MB/i) });
  });

  it('authenticates uploads and returns WebP even when the declared MIME disagrees with the file bytes', async () => {
    const png = await sharp({ create: { width: 40, height: 20, channels: 3, background: '#c49a45' } }).png().toBuffer();
    const response = await POST(makeRequest(new File([png], 'photo.jpg', { type: 'image/jpeg' }), 'gallery'));
    const result = await response.json();

    expect(response.status).toBe(201);
    existingAssets.add(path.basename(result.asset.url));
    expect(result.asset.url).toMatch(/^\/uploads\/.+\.webp$/);
    expect(result.asset).toMatchObject({ width: 40, height: 20 });
    const saved = await sharp(await readFile(path.join(uploadDirectory, path.basename(result.asset.url)))).metadata();
    expect(saved.format).toBe('webp');
  });

  it('rejects uploads when the CMS session is not authenticated', async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null);
    const request = new Request('http://localhost/api/admin/assets', { method: 'POST' });

    expect((await POST(request)).status).toBe(401);
  });

  it('removes the main WebP and temporary files when card thumbnail storage fails', async () => {
    const before = (await readdir(uploadDirectory)).sort();
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    vi.mocked(rename).mockImplementationOnce(actual.rename).mockRejectedValueOnce(new Error('disk full'));
    const png = await sharp({ create: { width: 800, height: 400, channels: 3, background: '#c49a45' } }).png().toBuffer();

    const response = await POST(makeRequest(new File([png], 'cover.png', { type: 'image/png' }), 'cover'));
    const after = (await readdir(uploadDirectory)).sort();
    await Promise.all(after.filter((fileName) => !before.includes(fileName))
      .map((fileName) => rm(path.join(uploadDirectory, fileName), { force: true })));

    expect(response.status).toBe(500);
    expect(after).toEqual(before);
  });
});
