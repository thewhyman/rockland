'use client';

import { useState } from 'react';

function formatCurrency(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  let color = 'bg-slate-100 text-slate-700';
  if (score >= 90) color = 'bg-green-100 text-green-800';
  else if (score >= 70) color = 'bg-blue-100 text-blue-800';
  else if (score >= 50) color = 'bg-yellow-100 text-yellow-800';
  else if (score >= 30) color = 'bg-orange-100 text-orange-800';
  else color = 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}/100
    </span>
  );
}

export default function DiscoveryPage() {
  const [keyword, setKeyword] = useState('federally qualified health center');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [total, setTotal] = useState(null);

  // Per-grant state
  const [grantStates, setGrantStates] = useState({});

  function setGrantState(grantId, updates) {
    setGrantStates((prev) => ({
      ...prev,
      [grantId]: { ...(prev[grantId] || {}), ...updates },
    }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setGrantStates({});

    try {
      const res = await fetch('/api/search-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSearchError(json.error || 'Search failed');
      } else {
        setResults(json.data || []);
        setTotal(json.total);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleScore(grant) {
    const id = grant.id;
    setGrantState(id, { scoring: true, scoreError: null });

    try {
      const res = await fetch('/api/score-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGrantState(id, { scoring: false, scoreError: json.error || 'Scoring failed' });
      } else {
        setGrantState(id, { scoring: false, score: json.score, reason: json.reason });
      }
    } catch (err) {
      setGrantState(id, { scoring: false, scoreError: err.message });
    }
  }

  async function handleSave(grant) {
    const id = grant.id;
    const gs = grantStates[id] || {};
    setGrantState(id, { saving: true, saveError: null, saved: false });

    try {
      const res = await fetch('/api/save-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant,
          score: gs.score ?? null,
          reason: gs.reason ?? '',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGrantState(id, { saving: false, saveError: json.error || 'Save failed' });
      } else {
        setGrantState(id, { saving: false, saved: true });
      }
    } catch (err) {
      setGrantState(id, { saving: false, saveError: err.message });
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Grant Discovery</h1>
        <p className="text-slate-500 text-sm mt-1">
          Search Grants.gov opportunities and score them against your organization profile.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search keyword..."
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          {searching ? 'Searching...' : 'Search Grants'}
        </button>
      </form>

      {searchError && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
          {searchError}
        </div>
      )}

      {total != null && !searching && (
        <p className="text-sm text-slate-500 mb-4">
          Showing {results.length} of {total} results
        </p>
      )}

      {searching && (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-500 text-sm">Searching Grants.gov...</div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((grant) => {
          const gs = grantStates[grant.id] || {};
          const funding = [formatCurrency(grant.awardFloor), formatCurrency(grant.awardCeiling)]
            .filter(Boolean)
            .join(' – ');

          return (
            <div key={grant.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">{grant.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-500">{grant.agency}</span>
                    {grant.deadline && (
                      <span className="text-xs text-slate-500">
                        Deadline: <span className="font-medium text-slate-700">{formatDate(grant.deadline)}</span>
                      </span>
                    )}
                    {funding && (
                      <span className="text-xs text-slate-500">
                        Award: <span className="font-medium text-slate-700">{funding}</span>
                      </span>
                    )}
                    {grant.cfdaNumbers && (
                      <span className="text-xs text-slate-500">
                        CFDA: <span className="font-medium text-slate-700">{grant.cfdaNumbers}</span>
                      </span>
                    )}
                  </div>
                  {grant.synopsis && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{grant.synopsis}</p>
                  )}
                </div>
                {gs.score != null && <ScoreBadge score={gs.score} />}
              </div>

              {gs.reason && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">AI Match Analysis: </span>
                    {gs.reason}
                  </p>
                </div>
              )}

              {gs.scoreError && (
                <div className="mt-2 text-xs text-red-600">{gs.scoreError}</div>
              )}
              {gs.saveError && (
                <div className="mt-2 text-xs text-red-600">{gs.saveError}</div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleScore(grant)}
                  disabled={gs.scoring}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {gs.scoring ? 'Scoring...' : gs.score != null ? 'Re-score' : 'Score Eligibility'}
                </button>
                {gs.saved ? (
                  <span className="text-xs font-medium text-green-700 px-3 py-1.5">
                    Saved to Pipeline
                  </span>
                ) : (
                  <button
                    onClick={() => handleSave(grant)}
                    disabled={gs.saving}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {gs.saving ? 'Saving...' : 'Save to Pipeline'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!searching && results.length === 0 && total == null && (
        <div className="text-center py-16 text-slate-400 text-sm">
          Search for grant opportunities above to get started.
        </div>
      )}

      {!searching && results.length === 0 && total === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No results found for your search. Try different keywords.
        </div>
      )}
    </div>
  );
}
