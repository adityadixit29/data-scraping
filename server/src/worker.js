import 'dotenv/config';
import { Worker } from 'bullmq';
import { getRedisConnection } from './queue/redis.js';
import { fetchJobsFromFeed } from './services/fetchJobs.js';
import Job from './models/Job.js';
import ImportLog from './models/ImportLog.js';
import { connectDb } from './db.js';

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);

async function processImportFeed(job) {
  const { fileName } = job.data; // fileName = feed URL
  console.log('[Worker] Processing feed:', fileName?.slice(0, 60) + '...');
  const stats = {
    totalFetched: 0,
    newJobs: 0,
    updatedJobs: 0,
    failedJobs: 0,
    failureReasons: [],
  };

  try {
    await connectDb();
  } catch (err) {
    console.error('[Worker] MongoDB connect error:', err.message);
    throw err;
  }

  let jobs = [];
  try {
    jobs = await fetchJobsFromFeed(fileName);
    console.log('[Worker] Fetched', jobs.length, 'jobs from feed');
  } catch (err) {
    console.error('[Worker] Fetch error for', fileName?.slice(0, 50), err.message);
    stats.failureReasons.push(`Fetch error: ${err.message}`);
    await ImportLog.create({
      fileName,
      totalFetched: 0,
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 1,
      failureReasons: stats.failureReasons,
    });
    return;
  }

  stats.totalFetched = jobs.length;

  for (const j of jobs) {
    try {
      const existing = await Job.findOne({
        sourceUrl: j.sourceUrl,
        externalId: j.externalId,
      });
      if (existing) {
        await Job.updateOne(
          { _id: existing._id },
          {
            title: j.title,
            description: j.description,
            company: j.company,
            location: j.location,
            link: j.link,
            publishedAt: j.publishedAt,
            raw: j.raw,
          }
        );
        stats.updatedJobs++;
      } else {
        await Job.create(j);
        stats.newJobs++;
      }
    } catch (err) {
      stats.failedJobs++;
      const msg = `${j.externalId}: ${err.message}`;
      if (stats.failureReasons.length < 20) stats.failureReasons.push(msg);
    }
  }

  await ImportLog.create({
    fileName,
    totalFetched: stats.totalFetched,
    totalImported: stats.newJobs + stats.updatedJobs,
    newJobs: stats.newJobs,
    updatedJobs: stats.updatedJobs,
    failedJobs: stats.failedJobs,
    failureReasons: stats.failureReasons,
  });
  console.log('[Worker] Done. Imported:', stats.newJobs + stats.updatedJobs, '| New:', stats.newJobs, '| Updated:', stats.updatedJobs, '| Failed:', stats.failedJobs);
}

async function main() {
  console.log('[Worker] Connecting to MongoDB...');
  await connectDb();
  console.log('[Worker] Connecting to Redis:', process.env.REDIS_URL || 'redis://localhost:6379');
  const connection = getRedisConnection();
  connection.on('connect', () => console.log('[Worker] Redis connected'));
  connection.on('error', (err) => console.error('[Worker] Redis error:', err.message));
  const worker = new Worker(
    'job-import',
    async (job) => {
      await processImportFeed(job);
    },
    {
      connection,
      concurrency: CONCURRENCY,
    }
  );

  worker.on('completed', (job) => console.log('[Worker] Job', job.id, 'completed'));
  worker.on('failed', (job, err) => console.error('[Worker] Job', job?.id, 'failed:', err.message));
  worker.on('error', (err) => console.error('[Worker] Queue error:', err.message));

  console.log('[Worker] Listening for jobs on queue "job-import", concurrency:', CONCURRENCY);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
