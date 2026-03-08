'use client';

import React, { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = ['reviewing', 'applying', 'submitted', 'awarded', 'passed'];

const STATUS_STYLES = {
  reviewing: 'bg-slate-100 text-slate-700',
  applying: 'bg-blue-100 text-blue-800',
  submitted: 'bg-indigo-100 text-indigo-800',
  awarded: 'bg-green-100 text-green-800',
  passed: 'bg-red-100 text-red-800',
};

function formatCurrency(val) {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return '—';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function deadlineBadgeClass(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const daysUntil = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'text-slate-400';
  if (daysUntil < 14) return 'text-red-600 font-semibold';
  if (daysUntil < 30) return 'text-yellow-600 font-semibold';
  return 'text-green-700';
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-slate-400 text-sm">—</span>;
  let color = 'bg-slate-100 text-slate-700';
  if (score >= 90) color = 'bg-green-100 text-green-800';
  else if (score >= 70) color = 'bg-blue-100 text-blue-800';
  else if (score >= 50) color = 'bg-yellow-100 text-yellow-800';
  else if (score >= 30) color = 'bg-orange-100 text-orange-800';
  else color = 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}/100
    </span>
  );
}

export default function PipelinePage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to fetch pipeline');
      } else {
        setGrants(json.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (res.ok) {
        setGrants((prev) =>
          prev.map((g) => (g.id === id ? { ...g, status: json.data.status } : g))
        );
      }
    } catch (_) {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this grant from your pipeline?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/pipeline?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGrants((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (_) {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500 text-sm">Loading pipeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grant Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage your active grant applications.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-500">&lt;14 days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-500">&lt;30 days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-slate-500">30+ days</span>
          </div>
        </div>
      </div>

      {grants.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No grants in your pipeline yet. Use Discovery to find and save grants.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Grant</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Agency</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Funding</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">AI Score</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grants.map((grant) => {
                  const funding = (() => {
                    const floor = formatCurrency(grant.amount_min);
                    const ceil = formatCurrency(grant.amount_max);
                    if (floor === '—' && ceil === '—') return '—';
                    if (floor === ceil) return floor;
                    return `${floor} – ${ceil}`;
                  })();

                  return (
                    <React.Fragment key={grant.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <button
                            onClick={() => setExpandedId(expandedId === grant.id ? null : grant.id)}
                            className="text-left font-medium text-slate-900 hover:text-blue-700 line-clamp-2 text-sm leading-tight"
                          >
                            {grant.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{grant.agency || '—'}</td>
                        <td className={`px-4 py-3 text-xs whitespace-nowrap ${deadlineBadgeClass(grant.deadline)}`}>
                          {formatDate(grant.deadline)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">{funding}</td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={grant.match_score} />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={grant.status || 'reviewing'}
                            onChange={(e) => handleStatusChange(grant.id, e.target.value)}
                            disabled={updatingId === grant.id}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_STYLES[grant.status] || STATUS_STYLES.reviewing}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(grant.id)}
                            disabled={deletingId === grant.id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                          >
                            {deletingId === grant.id ? 'Removing...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === grant.id && grant.match_reason && (
                        <tr key={`${grant.id}-expanded`} className="bg-blue-50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">AI Match Analysis: </span>
                              {grant.match_reason}
                            </div>
                            {grant.description && (
                              <div className="text-xs text-slate-600 mt-1">
                                <span className="font-semibold text-slate-700">Synopsis: </span>
                                {grant.description}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            {grants.length} grant{grants.length !== 1 ? 's' : ''} in pipeline
          </div>
        </div>
      )}
    </div>
  );
}
