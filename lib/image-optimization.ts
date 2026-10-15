import sharp, { type Metadata, type ResizeOptions } from 'sharp';
import { IMAGE_TOO_LARGE_MESSAGE, MAX_IMAGE_BYTES } from './image-constants';

export { IMAGE_TOO_LARGE_MESSAGE, MAX_IMAGE_BYTES } from './image-constants';

export type ImageDestination = 'cover' | 'gallery' | 'content';

export type OptimizedImage = {
  main: Buffer;
  width: number;
  height: number;
  thumbnail?: Buffer;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}
const MAX_INPUT_PIXELS = 40_000_000;
const TARGETS: Record<ImageDestination, ResizeOptions> = {
  cover: { width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true },
  gallery: { width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true },
  content: { width: 1200, withoutEnlargement: true },
};
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif', 'tiff', 'gif']);
const WEBP_QUALITIES = [80, 75, 70, 65];
const REUSE_WEBP_MAX_BYTES = 300 * 1024;
const PREFERRED_IMAGE_BYTES = 300 * 1024;
const PREFERRED_THUMBNAIL_BYTES = 100 * 1024;

const sharpInput = (input: Buffer) => sharp(input, {
  failOn: 'error',
  limitInputPixels: MAX_INPUT_PIXELS,
  animated: true,
  sequentialRead: true,
});

function isMetadataFree(metadata: Metadata) {
  return !metadata.orientation && !metadata.exif && !metadata.icc && !metadata.iptc
    && !metadata.xmp && !metadata.tifftagPhotoshop;
}

function fitsTarget(metadata: Metadata, target: ResizeOptions) {
  return Boolean(metadata.width && metadata.height)
    && (!target.width || metadata.width! <= target.width)
    && (!target.height || metadata.height! <= target.height);
}

async function encodeWebp(input: Buffer, resize: ResizeOptions, targetBytes: number) {
  let output = Buffer.alloc(0);
  for (const quality of WEBP_QUALITIES) {
    output = await sharpInput(input)
      .rotate()
      .resize(resize)
      .webp({ quality, alphaQuality: 100, effort: 5, smartSubsample: true })
      .toBuffer();
    if (output.length <= targetBytes) break;
  }
  return output;
}

async function getDimensions(input: Buffer) {
  const metadata = await sharpInput(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error('A imagem não possui dimensões válidas.');
  return { width: metadata.width, height: metadata.height };
}

export async function optimizeImage(
  input: Buffer,
  destination: ImageDestination,
  originalSize: number,
): Promise<OptimizedImage> {
  if (!Number.isSafeInteger(originalSize) || originalSize <= 0 || originalSize !== input.length) {
    throw new ImageValidationError('Arquivo de imagem inválido.');
  }
  if (originalSize > MAX_IMAGE_BYTES) throw new ImageValidationError(IMAGE_TOO_LARGE_MESSAGE);
  if (!(destination in TARGETS)) throw new ImageValidationError('Destino de imagem inválido.');

  let metadata: Metadata;
  try {
    metadata = await sharpInput(input).metadata();
  } catch {
    throw new ImageValidationError('Formato não aceito ou imagem inválida/corrompida. Envie JPG, JPEG, PNG ou WebP.');
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new ImageValidationError('Formato não aceito. Envie JPG, JPEG, PNG ou WebP.');
  }
  if (metadata.pages && metadata.pages > 1) {
    throw new ImageValidationError('Imagens animadas não são permitidas.');
  }
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new ImageValidationError('A resolução da imagem excede o limite permitido.');
  }

  const target = TARGETS[destination];
  const canReuseInput = metadata.format === 'webp'
    && isMetadataFree(metadata)
    && fitsTarget(metadata, target)
    && input.length <= REUSE_WEBP_MAX_BYTES;
  const main = canReuseInput
    ? input
    : await encodeWebp(input, target, Math.min(originalSize, PREFERRED_IMAGE_BYTES));
  const dimensions = await getDimensions(main);
  if (destination !== 'cover') return { main, ...dimensions };

  const thumbnail = await encodeWebp(input, {
    width: 600,
    height: 400,
    fit: 'inside',
    withoutEnlargement: true,
  }, Math.min(originalSize, PREFERRED_THUMBNAIL_BYTES));
  const thumbnailDimensions = await getDimensions(thumbnail);
  return { main, ...dimensions, thumbnail, ...Object.fromEntries([
    ['thumbnailWidth', thumbnailDimensions.width],
    ['thumbnailHeight', thumbnailDimensions.height],
  ]) } as OptimizedImage;
}
