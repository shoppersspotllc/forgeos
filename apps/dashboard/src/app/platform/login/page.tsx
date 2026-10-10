'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Private-preview login. Demo gate only — not production identity. */
export default function PlatformLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [tenant, setTenant] = useState('demo');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/platform/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tenant }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j?.data?.error ?? 'Login failed');
        return;
      }
      // Server also set the httpOnly session cookie; keep the token for API calls.
      sessionStorage.setItem('ymp_token', j.data.token);
      router.push('/platform');
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 28, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Private preview access</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
        Demo gate for the Young Money platform preview. TEST data only — not production identity.
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          Preview access code
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          Workspace (tenant)
          <input
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            placeholder="demo"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
        <button
          type="submit"
          disabled={busy}
          style={{ padding: '10px 12px', borderRadius: 8, background: '#10b981', color: '#04120c', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Checking…' : 'Enter preview'}
        </button>
      </form>
    </div>
  );
}
