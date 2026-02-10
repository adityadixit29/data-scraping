'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type ImportLog = {
  _id: string;
  fileName: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  failureReasons: string[];
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchHistory = async (page: number, limit: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filter) params.set('fileName', filter);
      const res = await fetch(`${API}/api/imports/history?${params}`);
      const json = await res.json();
      if (res.ok) {
        setLogs(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, filter]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((p) => ({ ...p, page }));
  };

  const setLimit = (limit: number) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await fetch(`${API}/api/imports/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(json.message);
        fetchHistory(1, pagination.limit);
      } else alert('Error: ' + (json.error || res.statusText || 'Failed'));
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleString();

  const btnStyle = (enabled: boolean) => ({
    padding: '8px 14px',
    background: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    color: '#e4e4e7',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.6,
  });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Import History</h1>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          style={{
            padding: '10px 20px',
            background: triggering ? '#555' : '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: triggering ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {triggering ? 'Triggering…' : 'Trigger import (all feeds)'}
        </button>
      </header>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: 8 }}>Filter by URL (fileName):</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="e.g. jobicy"
            style={{
              padding: '8px 12px',
              width: 280,
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              color: '#e4e4e7',
            }}
          />
        </div>
        <div>
          <label style={{ marginRight: 8 }}>Rows per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              color: '#e4e4e7',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Loading…</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #3f3f46' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#18181b', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>FileName (URL)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fetched</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>New</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Updated</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Failed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reasons</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, color: '#71717a', textAlign: 'center' }}>
                      No import logs yet. Trigger an import or wait for the hourly cron.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} style={{ borderTop: '1px solid #27272a' }}>
                      <td style={{ padding: '12px 16px', maxWidth: 320, wordBreak: 'break-all' }} title={log.fileName}>
                        {log.fileName}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>{log.totalFetched}</td>
                      <td style={{ padding: '12px 16px' }}>{log.totalImported}</td>
                      <td style={{ padding: '12px 16px', color: '#22c55e' }}>{log.newJobs}</td>
                      <td style={{ padding: '12px 16px', color: '#3b82f6' }}>{log.updatedJobs}</td>
                      <td style={{ padding: '12px 16px', color: log.failedJobs ? '#ef4444' : undefined }}>{log.failedJobs}</td>
                      <td style={{ padding: '12px 16px', maxWidth: 240, fontSize: 12, color: '#a1a1aa' }}>
                        {log.failureReasons?.length ? log.failureReasons.slice(0, 3).join('; ') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logs.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(1)}
                style={btnStyle(pagination.page > 1)}
                title="First page"
              >
                First
              </button>
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                style={btnStyle(pagination.page > 1)}
              >
                Previous
              </button>
              <span style={{ color: '#a1a1aa', marginLeft: 4, marginRight: 4 }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              {(() => {
                const total = pagination.totalPages;
                const current = pagination.page;
                const pages: (number | 'ellipsis')[] = [];
                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (current > 3) pages.push('ellipsis');
                  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  if (current < total - 2) pages.push('ellipsis');
                  if (total > 1) pages.push(total);
                }
                return pages.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`e-${idx}`} style={{ color: '#71717a', padding: '0 4px' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      style={{
                        ...btnStyle(true),
                        minWidth: 36,
                        background: p === current ? '#7c3aed' : undefined,
                      }}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                style={btnStyle(pagination.page < pagination.totalPages)}
              >
                Next
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.totalPages)}
                style={btnStyle(pagination.page < pagination.totalPages)}
                title="Last page"
              >
                Last
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
