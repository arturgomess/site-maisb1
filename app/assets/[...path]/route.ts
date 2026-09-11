import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';

export const runtime = 'nodejs';

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function HEAD(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;
  const assetsRoot = path.resolve(process.cwd(), 'assets');
  const assetPath = path.resolve(assetsRoot, ...segments);

  if (assetPath !== assetsRoot && !assetPath.startsWith(`${assetsRoot}${path.sep}`)) {
    return new Response('Invalid asset path', { status: 400 });
  }

  try {
    const stats = await stat(assetPath);
    if (!stats.isFile()) {
      return new Response('Asset not found', { status: 404 });
    }

    const fileSize = stats.size;
    const extension = path.extname(assetPath).toLowerCase();
    const contentType = contentTypes[extension] || 'application/octet-stream';

    return new Response(null, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Asset not found', { status: 404 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;
  const assetsRoot = path.resolve(process.cwd(), 'assets');
  const assetPath = path.resolve(assetsRoot, ...segments);

  if (assetPath !== assetsRoot && !assetPath.startsWith(`${assetsRoot}${path.sep}`)) {
    return new Response('Invalid asset path', { status: 400 });
  }

  try {
    const stats = await stat(assetPath);
    if (!stats.isFile()) {
      return new Response('Asset not found', { status: 404 });
    }

    const fileSize = stats.size;
    const extension = path.extname(assetPath).toLowerCase();
    const contentType = contentTypes[extension] || 'application/octet-stream';
    const rangeHeader = request.headers.get('range');

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
        return new Response('Requested range not satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = createReadStream(assetPath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const nodeStream = createReadStream(assetPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Asset not found', { status: 404 });
  }
}
