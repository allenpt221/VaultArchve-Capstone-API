import redis from '../lib/ioredis';

export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  const staleKeys = await redis.keys(`${prefix}:*`);
  if (staleKeys.length > 0) {
    await redis.del(...staleKeys);
  }
}