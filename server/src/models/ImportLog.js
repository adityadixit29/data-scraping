import mongoose from 'mongoose';

const importLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // feed URL
    totalFetched: { type: Number, default: 0 },
    totalImported: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    failureReasons: [{ type: String }],
  },
  { timestamps: true }
);

importLogSchema.index({ createdAt: -1 });
importLogSchema.index({ fileName: 1, createdAt: -1 });

export default mongoose.model('ImportLog', importLogSchema, 'import_logs');
