import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { connectDb } from './db.js';
import importsRouter from './routes/imports.js';
import { addImportJobs } from './queue/index.js';
import { JOB_FEED_URLS } from './config/feeds.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/imports', importsRouter);
app.get('/health', (req, res) => res.json({ ok: true }));

// Cron: every hour, enqueue all feeds
cron.schedule('0 * * * *', async () => {
  try {
    await addImportJobs(JOB_FEED_URLS);
    console.log('Cron: queued all feeds for import');
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

const PORT = process.env.PORT || 4000;

// On Vercel we only export the app (no listen); Vercel invokes it per request.
if (!process.env.VERCEL) {
  connectDb()
    .then(() => {
      app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('DB connection failed:', err);
      process.exit(1);
    });
}

export default app;
