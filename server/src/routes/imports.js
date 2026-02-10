import { Router } from 'express';
import ImportLog from '../models/ImportLog.js';
import { addImportJobs, getImportQueue } from '../queue/index.js';
import { JOB_FEED_URLS } from '../config/feeds.js';

const router = Router();

/** GET /api/imports/history - paginated import logs */
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const fileName = req.query.fileName?.trim() || null;

    const filter = fileName ? { fileName: new RegExp(fileName, 'i') } : {};
    const [logs, total] = await Promise.all([
      ImportLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ImportLog.countDocuments(filter),
    ]);

    res.json({
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/imports/trigger - enqueue all feeds (or specific URLs) */
router.post('/trigger', async (req, res) => {
  try {
    const urls = req.body?.urls && Array.isArray(req.body.urls) ? req.body.urls : JOB_FEED_URLS;
    await addImportJobs(urls);
    res.json({ message: `Queued ${urls.length} feed(s) for import` });
  } catch (err) {
    console.error('POST /trigger error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/imports/feeds - list configured feed URLs */
router.get('/feeds', (req, res) => {
  res.json({ feeds: JOB_FEED_URLS });
});

/** GET /api/imports/queue-status - debug: jobs waiting/active in Redis */
router.get('/queue-status', async (req, res) => {
  try {
    const queue = getImportQueue();
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    res.json({
      queue: 'job-import',
      waiting,
      active,
      completed,
      failed,
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  } catch (err) {
    console.error('GET /queue-status error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
