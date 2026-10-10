'use client';

import { useEffect, useState } from 'react';

interface Approval {
  id: string;
  leadId: string;
  channel: string;
  draftText: string;
  aiGenerated: boolean;
  provider: string | null;
  model: string | null;
  status: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  simulatedSend: boolean;
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
};

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Approval[]>([]);
  const [decided, setDecided] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/platform/approvals');
    const json = await res.json();
    setPending(json.data.pending ?? []);
    setDecided(json.data.decided ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    await fetch('/api/platform/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Approval queue</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
        Drafted is <strong>not</strong> sent. Approving records a <strong>simulated</strong> send —
        audited, but nothing is actually transmitted to anyone.
      </p>
      <div
        style={{
          ...card,
          borderColor: 'rgba(245,158,11,0.4)',
          marginBottom: 20,
          fontSize: 13,
          color: '#fbbf24',
        }}
      >
        SIMULATED ENVIRONMENT — approving here never sends a real message.
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Pending ({pending.length})
          </h2>
          <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
            {pending.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Queue is empty.</p>
            )}
            {pending.map((a) => (
              <div key={a.id} style={card}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {a.channel.toUpperCase()} · lead {a.leadId} · AI-generated: {String(a.aiGenerated)}
                  {a.decisionNote && ` · ${a.decisionNote}`}
                </div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                    background: 'rgba(0,0,0,0.25)',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  {a.draftText}
                </pre>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={busy === a.id} onClick={() => decide(a.id, 'approve')} style={btnApprove}>
                    Approve — record simulated send
                  </button>
                  <button disabled={busy === a.id} onClick={() => decide(a.id, 'reject')} style={btnReject}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Decided ({decided.length})
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {decided.map((a) => (
              <div key={a.id} style={{ ...card, padding: 12, fontSize: 13 }}>
                <strong>{a.status.toUpperCase()}</strong> · {a.channel} · {a.leadId} ·{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {a.decidedAt} {a.simulatedSend && a.status === 'approved' ? '· SIMULATED send' : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const btnApprove: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: '#10b981',
  color: '#fff',
  border: 'none',
  fontSize: 13,
  cursor: 'pointer',
};

const btnReject: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: 'transparent',
  color: '#f87171',
  border: '1px solid rgba(239,68,68,0.4)',
  fontSize: 13,
  cursor: 'pointer',
};
