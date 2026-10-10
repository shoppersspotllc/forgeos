'use client';

/**
 * Young Money Revenue Dashboard
 * Primary revenue command center for the five-app initiative.
 *
 * DEFAULT VIEW: LIVE mode ($0.00 until genuine revenue).
 * TEST mode requires explicit toggle + shows persistent amber banner.
 */

import { useState, useEffect } from 'react';

type Mode = 'live' | 'test';

interface SummaryData {
  mode: Mode;
  generated_at: string;
  volatility_warning: string;
  target: { monthly_cents: number; monthly_display: string; progress_pct: number | null };
  total: {
    transaction_count: number;
    gross_cents: number;
    refunds_cents: number;
    fees_cents: number;
    fees_estimated: boolean;
    net_cents: number;
  };
  mrr: { mrr_cents: number; active_count: number; by_plan: Record<string, number> };
  per_app: Array<{
    app: string;
    transaction_count: number;
    gross_cents: number;
    refunds_cents: number;
    fees_cents: number;
    fees_estimated: boolean;
    net_cents: number;
    mrr_cents?: number;
    active_subscriptions?: number;
  }>;
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const APP_NAMES: Record<string, string> = {
  turnvia: 'Turnvia',
  quickvia: 'Quickvia',
  cardiq: 'Cardiq',
  menova: 'Menova',
  craftora: 'Craftora',
};

export default function YoungMoneyPage() {
  const [mode, setMode] = useState<Mode>('live');
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/young-money/revenue/summary?mode=${mode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [mode]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Young Money — Revenue</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#666' }}>Mode:</span>
          <button
            onClick={() => setMode('live')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === 'live' ? '#0070f3' : '#eee',
              color: mode === 'live' ? 'white' : '#666', fontWeight: 'bold',
            }}
          >
            ● LIVE
          </button>
          <button
            onClick={() => setMode('test')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === 'test' ? '#f59e0b' : '#eee',
              color: mode === 'test' ? 'white' : '#666', fontWeight: 'bold',
            }}
          >
            ○ TEST
          </button>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        {mode === 'live'
          ? 'Live transactions only. Test transactions are NEVER counted here.'
          : 'Test-mode transactions. Not real revenue.'}
      </p>

      {mode === 'test' && (
        <div style={{
          background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 8,
          padding: 16, marginBottom: 24,
        }}>
          <strong>⚠ TEST MODE</strong> — These are Stripe test transactions, not real money.
          They are tracked separately and will never appear in LIVE figures.
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {data && (
        <>
          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Gross Revenue', value: fmt(data.total.gross_cents) },
              { label: 'Refunds', value: fmt(data.total.refunds_cents) },
              { label: `Stripe Fees${data.total.fees_estimated ? ' (est.)' : ''}`, value: fmt(data.total.fees_cents) },
              { label: 'Net (after fees)', value: fmt(data.total.net_cents) },
            ].map((s) => (
              <div key={s.label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* MRR */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#888' }}>Cardiq MRR</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {fmt(data.mrr.mrr_cents)}/mo
              <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
                ({data.mrr.active_count} active)
              </span>
            </div>
          </div>

          {/* Target progress */}
          {data.target.progress_pct !== null && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                Progress to {data.target.monthly_display}/mo target: {data.target.progress_pct.toFixed(1)}%
              </div>
              <div style={{ background: '#eee', borderRadius: 4, height: 12 }}>
                <div style={{
                  background: '#0070f3', height: '100%', borderRadius: 4,
                  width: `${Math.min(100, data.target.progress_pct)}%`,
                }} />
              </div>
            </div>
          )}

          {/* Per-app breakdown */}
          <h2>Per-App Breakdown</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>App</th>
                <th style={{ padding: 8 }}>Txs</th>
                <th style={{ padding: 8 }}>Gross</th>
                <th style={{ padding: 8 }}>Refunds</th>
                <th style={{ padding: 8 }}>Fees</th>
                <th style={{ padding: 8 }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {data.per_app.map((app) => (
                <tr key={app.app} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, fontWeight: 'bold' }}>{APP_NAMES[app.app] || app.app}</td>
                  <td style={{ padding: 8 }}>{app.transaction_count}</td>
                  <td style={{ padding: 8 }}>{fmt(app.gross_cents)}</td>
                  <td style={{ padding: 8 }}>{fmt(app.refunds_cents)}</td>
                  <td style={{ padding: 8 }}>{fmt(app.fees_cents)}{app.fees_estimated ? ' *' : ''}</td>
                  <td style={{ padding: 8, fontWeight: 'bold' }}>{fmt(app.net_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.total.fees_estimated && (
            <p style={{ fontSize: 12, color: '#888' }}>* Estimated at 2.9% + $0.30. See Stripe Dashboard for exact fees.</p>
          )}

          {data.total.transaction_count === 0 && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No {mode} transactions yet.
            </p>
          )}

          <p style={{ fontSize: 12, color: '#888', marginTop: 24 }}>
            ℹ {data.volatility_warning}
          </p>
        </>
      )}
    </div>
  );
}
