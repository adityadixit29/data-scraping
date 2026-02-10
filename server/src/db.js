import mongoose from 'mongoose';

let connected = false;

export async function connectDb() {
  if (connected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-importer';
  await mongoose.connect(uri);
  connected = true;
  console.log('MongoDB connected:', mongoose.connection.db?.databaseName || 'job-importer');
  // Ensure database exists: MongoDB Atlas creates DB on first write; listCollections triggers it
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);
  if (!names.includes('jobs')) await db.createCollection('jobs');
  if (!names.includes('import_logs')) await db.createCollection('import_logs');
}
