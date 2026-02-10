import IORedis from 'ioredis';

let connection;

export function getRedisConnection() {
  if (!connection) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}
