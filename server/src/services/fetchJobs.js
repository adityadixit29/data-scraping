import axios from 'axios';
import { parseStringPromise } from 'xml2js';

/**
 * Fetches XML from URL and normalizes to a common job array.
 * Handles both Jobicy and Higheredjobs-style RSS.
 */
export async function fetchJobsFromFeed(url) {
  const res = await axios.get(url, {
    timeout: 30000,
    responseType: 'text',
    headers: { 'User-Agent': 'JobImporter/1.0' },
  });
  const xml = res.data;
  const parsed = await parseStringPromise(xml, {
    explicitArray: false,
    trim: true,
    ignoreAttrs: false,
  });
  return normalizeToJobs(parsed, url);
}

function normalizeToJobs(parsed, sourceUrl) {
  const jobs = [];
  const channel = parsed?.rss?.channel || parsed?.feed;
  if (!channel) return jobs;

  const items = [].concat(channel.item || channel.entry || []);
  for (const item of items) {
    const job = normalizeItem(item, sourceUrl);
    if (job) jobs.push(job);
  }
  return jobs;
}

function normalizeItem(item, sourceUrl) {
  const guid = item.guid?._ ?? item.guid ?? item.id ?? item.link;
  const link = typeof item.link === 'string' ? item.link : item.link?.href ?? item.link;
  if (!guid && !link) return null;

  const title = item.title ?? item['dc:title'] ?? '';
  const desc = item.description ?? item.summary ?? item['content:encoded'] ?? '';
  const pubDate = item.pubDate ?? item.published ?? item.updated;

  return {
    sourceUrl,
    externalId: String(guid || link),
    title: typeof title === 'string' ? title : title?._ ?? '',
    description: typeof desc === 'string' ? desc : desc?._ ?? '',
    company: item['dc:creator'] ?? item.author ?? '',
    location: item['job:location'] ?? item.location ?? '',
    link: typeof link === 'string' ? link : link?._ ?? link,
    publishedAt: pubDate ? new Date(pubDate) : null,
    raw: item,
  };
}
