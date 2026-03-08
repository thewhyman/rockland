'use client';

import { useState, useEffect } from 'react';

const SERVICES_OPTIONS = [
  'primary care',
  'dental',
  'mental health',
  'substance use',
  'case management',
  'OB/GYN',
  'pediatrics',
];

const GRANT_TYPES_OPTIONS = [
  'HRSA',
  'Ryan White',
  'HCAI',
  'state',
  'foundation',
  'federal',
];

export default function ProfilePage() {
  const [form, setForm] = useState({
    org_name: '',
    location: '',
    patient_population: '',
    annual_budget: '',
    services: [],
    active_grant_types: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/org-profile');
        const json = await res.json();
        if (json.data) {
          setForm({
            org_name: json.data.org_name || '',
            location: json.data.location || '',
            patient_population: json.data.patient_population || '',
            annual_budget: json.data.annual_budget != null ? String(json.data.annual_budget) : '',
            services: json.data.services || [],
            active_grant_types: json.data.active_grant_types || [],
          });
        }
      } catch (err) {
        // No profile yet, that's fine
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function toggleMultiSelect(field, value) {
    setForm((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/org-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Failed to save profile' });
      } else {
        setMessage({ type: 'success', text: 'Organization profile saved successfully.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-slate-500 text-sm">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Organization Profile</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure your FQHC profile to enable AI-powered grant matching.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.org_name}
            onChange={(e) => setForm((p) => ({ ...p, org_name: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. Community Health Partners of Los Angeles"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. Los Angeles, CA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Patient Population
          </label>
          <textarea
            value={form.patient_population}
            onChange={(e) => setForm((p) => ({ ...p, patient_population: e.target.value }))}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your primary patient population..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Annual Budget (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              value={form.annual_budget}
              onChange={(e) => setForm((p) => ({ ...p, annual_budget: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4500000"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Services Offered
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICES_OPTIONS.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => toggleMultiSelect('services', service)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.services.includes(service)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Active Grant Types
          </label>
          <div className="flex flex-wrap gap-2">
            {GRANT_TYPES_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleMultiSelect('active_grant_types', type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.active_grant_types.includes(type)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
