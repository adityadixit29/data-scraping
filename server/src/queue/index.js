import { Queue } from 'bullmq';
import { getRedisConnection } from './redis.js';

const QUEUE_NAME = 'job-import';

export function getImportQueue() {
  const connection = getRedisConnection();
  return new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
    },
  });
}

export async function addImportJob(fileName) {
  const queue = getImportQueue();
  await queue.add('import-feed', { fileName }, { jobId: `import-${Date.now()}-${fileName.length}` });
}

export async function addImportJobs(fileNames) {
  const queue = getImportQueue();
  const jobs = fileNames.map((fileName) => ({
    name: 'import-feed',
    data: { fileName },
    opts: { jobId: `import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` },
  }));
  await queue.addBulk(jobs);
}
