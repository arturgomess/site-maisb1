import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isAdminAuthenticated } from '../../../../lib/cms-auth';
import { IMAGE_TOO_LARGE_MESSAGE, MAX_IMAGE_BYTES } from '../../../../lib/image-constants';
import { ImageValidationError, optimizeImage, type ImageDestination } from '../../../../lib/image-optimization';

export const runtime = 'nodejs';

const destinations = new Set<ImageDestination>(['cover', 'gallery', 'content']);
const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');
const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

async function readBoundedBody(request: Request) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) throw new RangeError('Request body too large');
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new RangeError('Request body too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  let formData: FormData;
  try {
    const body = await readBoundedBody(request);
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });
    formData = await boundedRequest.formData();
  } catch (error) {
    if (error instanceof RangeError) {
      return Response.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Envie um arquivo de imagem.' }, { status: 400 });
  if (!file.size) return Response.json({ error: 'O arquivo está vazio. Selecione uma imagem válida.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: IMAGE_TOO_LARGE_MESSAGE }, { status: 400 });

  const destinationValue = formData.get('destination') || 'cover';
  if (typeof destinationValue !== 'string' || !destinations.has(destinationValue as ImageDestination)) {
    return Response.json({ error: 'Destino de imagem inválido.' }, { status: 400 });
  }
  const destination = destinationValue as ImageDestination;

  let optimized;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    optimized = await optimizeImage(input, destination, file.size);
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: 'Não foi possível otimizar a imagem.' }, { status: 422 });
  }

  const assetId = randomUUID();
  const mainName = `${assetId}.webp`;
  const thumbnailName = optimized.thumbnail ? `${assetId}-card.webp` : undefined;
  const createdPaths: string[] = [];
  const writeAsset = async (fileName: string, contents: Buffer) => {
    const finalPath = path.join(uploadDirectory, fileName);
    const tempPath = `${finalPath}.${randomUUID()}.tmp`;
    createdPaths.push(tempPath, finalPath);
    await writeFile(tempPath, contents, { flag: 'wx' });
    await rename(tempPath, finalPath);
  };

  try {
    await mkdir(uploadDirectory, { recursive: true });
    await writeAsset(mainName, optimized.main);
    if (optimized.thumbnail && thumbnailName) await writeAsset(thumbnailName, optimized.thumbnail);
  } catch {
    await Promise.all(createdPaths.map((filePath) => rm(filePath, { force: true }).catch(() => undefined)));
    return Response.json({ error: 'Não foi possível armazenar a imagem otimizada.' }, { status: 500 });
  }

  return Response.json({
    asset: {
      id: mainName,
      url: `/uploads/${mainName}`,
      width: optimized.width,
      height: optimized.height,
      ...(thumbnailName ? {
        thumbnailUrl: `/uploads/${thumbnailName}`,
        thumbnailWidth: optimized.thumbnailWidth,
        thumbnailHeight: optimized.thumbnailHeight,
      } : {}),
    },
  }, { status: 201 });
}
