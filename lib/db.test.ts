import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

describe('generated Prisma client', () => {
  it('exposes the consent log delegate required by consent persistence', async () => {
    const client = new PrismaClient() as unknown as { analyticsConsentLog?: { create?: unknown }; $disconnect: () => Promise<void> };
    try {
      expect(client.analyticsConsentLog?.create).toBeTypeOf('function');
    } finally {
      await client.$disconnect();
    }
  });
});
