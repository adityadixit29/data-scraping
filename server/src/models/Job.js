import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true, index: true },
    externalId: { type: String, required: true, index: true },
    title: String,
    description: String,
    company: String,
    location: String,
    link: String,
    publishedAt: Date,
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

jobSchema.index({ sourceUrl: 1, externalId: 1 }, { unique: true });

export default mongoose.model('Job', jobSchema);
