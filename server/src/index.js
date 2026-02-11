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

// Root: simple page to check if server is running
app.get('/', (req, res) => {
  res.type('html');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Job Importer API</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem;">
        <h1>Job Importer API</h1>
        <p><strong>Status:</strong> <span style="color: green;">Running</span></p>
        <p>Endpoints:</p>
        <ul>
          <li><a href="/health">/health</a> – health check (JSON)</li>
          <li><a href="/api/imports/history">/api/imports/history</a> – import history</li>
          <li><a href="/api/imports/feeds">/api/imports/feeds</a> – feed URLs</li>
          <li><a href="/api/imports/queue-status">/api/imports/queue-status</a> – queue status</li>
        </ul>
      </body>
    </html>
  `);
});

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
