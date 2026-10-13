import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { optimizeImage } from './image-optimization';

const transparentPng = (width: number, height: number) => sharp({
  create: { width, height, channels: 4, background: { r: 30, g: 50, b: 70, alpha: 0 } },
}).png().toBuffer();

describe('optimizeImage', () => {
  it('accepts an original exactly at the 2 MiB limit', async () => {
    const valid = await transparentPng(32, 16);
    const input = Buffer.concat([valid, Buffer.alloc(2 * 1024 * 1024 - valid.length)]);

    await expect(optimizeImage(input, 'content', input.length)).resolves.toMatchObject({
      width: 32,
      height: 16,
    });
  });

  it('rejects originals larger than 2 MiB before decoding', async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);
    await expect(optimizeImage(oversized, 'content', oversized.length))
      .rejects.toThrow(/2 MB/i);
  });

  it('converts a banner to WebP and creates a bounded card thumbnail without changing aspect ratio', async () => {
    const input = await transparentPng(2400, 1200);
    const output = await optimizeImage(input, 'cover', input.length);
    const mainMetadata = await sharp(output.main).metadata();
    const thumbnailMetadata = await sharp(output.thumbnail!).metadata();

    expect(mainMetadata.format).toBe('webp');
    expect(mainMetadata.width).toBeLessThanOrEqual(1920);
    expect(mainMetadata.height).toBeLessThanOrEqual(1080);
    expect(output.width / output.height).toBeCloseTo(2, 2);
    expect(thumbnailMetadata.format).toBe('webp');
    expect(thumbnailMetadata.width).toBeLessThanOrEqual(600);
    expect(thumbnailMetadata.height).toBeLessThanOrEqual(400);
    expect(output.thumbnailWidth! / output.thumbnailHeight!).toBeCloseTo(2, 2);
  });

  it('preserves transparency in WebP output', async () => {
    const input = await transparentPng(120, 80);
    const output = await optimizeImage(input, 'gallery', input.length);
    const { data, info } = await sharp(output.main).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    expect(info.channels).toBe(4);
    expect(data[3]).toBe(0);
  });

  it('fits gallery images within 1200 square without enlarging or cropping', async () => {
    const smallInput = await transparentPng(320, 180);
    const small = await optimizeImage(smallInput, 'gallery', smallInput.length);
    const largeInput = await transparentPng(2400, 1200);
    const large = await optimizeImage(largeInput, 'gallery', largeInput.length);

    expect(small).toMatchObject({ width: 320, height: 180 });
    expect(large).toMatchObject({ width: 1200, height: 600 });
  });

  it('applies lossy compression when converting a photographic JPEG', async () => {
    const pixels = Buffer.alloc(1600 * 800 * 3);
    let seed = 73;
    for (let y = 0; y < 800; y += 1) {
      for (let x = 0; x < 1600; x += 1) {
        const offset = (y * 1600 + x) * 3;
        seed = (seed * 48271) % 2147483647;
        pixels[offset] = seed & 255;
        seed = (seed * 48271) % 2147483647;
        pixels[offset + 1] = seed & 255;
        seed = (seed * 48271) % 2147483647;
        pixels[offset + 2] = seed & 255;
      }
    }
    const input = await sharp(pixels, { raw: { width: 1600, height: 800, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
    const output = await optimizeImage(input, 'content', input.length);
    const webpAtSuggestedQuality = await sharp(input)
      .webp({ quality: 80, alphaQuality: 100, effort: 5, smartSubsample: true })
      .toBuffer();

    expect((await sharp(output.main).metadata()).format).toBe('webp');
    expect(output.main.length).toBeLessThan(input.length);
    expect(webpAtSuggestedQuality.length).toBeGreaterThan(300 * 1024);
    expect(output.main.length).toBeLessThan(webpAtSuggestedQuality.length);
  });

  it('rejects invalid image bytes', async () => {
    await expect(optimizeImage(Buffer.from('not an image'), 'content', 12))
      .rejects.toThrow(/imagem inválida/i);
  });

  it('rejects SVG even though Sharp can rasterize it', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>');

    await expect(optimizeImage(svg, 'content', svg.length)).rejects.toThrow(/formato não aceito/i);
  });

  it('converts static AVIF input to WebP', async () => {
    const avif = await sharp({ create: { width: 40, height: 20, channels: 3, background: '#c49a45' } }).avif().toBuffer();
    const output = await optimizeImage(avif, 'content', avif.length);

    expect((await sharp(output.main).metadata()).format).toBe('webp');
  });

  it('reuses an already optimized WebP banner while still producing a card thumbnail', async () => {
    const source = await transparentPng(320, 180);
    const webp = await sharp(source).webp({ quality: 80 }).toBuffer();
    const output = await optimizeImage(webp, 'cover', webp.length);

    expect(output.main).toBe(webp);
    expect(output.thumbnail).toBeDefined();
  });

  it('applies EXIF orientation before reporting dimensions and strips the orientation metadata', async () => {
    const input = await sharp({
      create: { width: 100, height: 200, channels: 3, background: '#c49a45' },
    }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const output = await optimizeImage(input, 'content', input.length);
    const metadata = await sharp(output.main).metadata();

    expect(output).toMatchObject({ width: 200, height: 100 });
    expect(metadata.orientation).toBeUndefined();
  });
});
