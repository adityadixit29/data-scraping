/**
 * Vercel serverless entry. Vercel uses this file (see vercel.json), not npm start.
 * Each request runs this handler; the worker does NOT run on Vercel (use Render/Railway for worker).
 */
import app from './src/index.js';
import { connectDb } from './src/db.js';

export default async function handler(req, res) {
  await connectDb();
  return app(req, res);
}
