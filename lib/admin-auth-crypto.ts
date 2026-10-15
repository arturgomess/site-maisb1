import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_KEY_BYTES = 64;
const MAX_MEMORY_BYTES = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer, cost: number, blockSize: number, parallelization: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, PASSWORD_KEY_BYTES, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: MAX_MEMORY_BYTES,
    }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey));
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION);
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyAdminPassword(password: string, encodedHash: string) {
  const [algorithm, costValue, blockValue, parallelValue, saltValue, keyValue, extra] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !costValue || !blockValue || !parallelValue || !saltValue || !keyValue || extra !== undefined) return false;

  const cost = Number(costValue);
  const blockSize = Number(blockValue);
  const parallelization = Number(parallelValue);
  if (cost !== SCRYPT_COST || blockSize !== SCRYPT_BLOCK_SIZE || parallelization !== SCRYPT_PARALLELIZATION) return false;

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(keyValue, 'base64url');
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_BYTES) return false;
    const actual = await deriveKey(password, salt, cost, blockSize, parallelization);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
