'use client';

import { useEffect, useState } from 'react';

interface Lead {
  id: string;
  customerName: string;
  trade: string;
  phone: string;
  quoteAmount: number;
  quoteSentAt: string;
  lastFollowUpAt: string | null;
  status: string;
  outcome: string;
  neglected: boolean;
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/platform/leads');
    const json = await res.json();
    setLeads(json.data.leads ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const draft = async (id: string, channel: 'sms' | 'email') => {
    setBusy(id + channel);
    setNotice(null);
    const res = await fetch(`/api/platform/leads/${id}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) {
      setNotice(`Error: ${json.data?.error ?? 'draft failed'}`);
      return;
    }
    setNotice(
      `Draft queued for approval (aiGenerated=${json.data.approval.aiGenerated}). Nothing was sent.`
    );
    load();
  };

  const setOutcome = async (id: string, outcome: 'won' | 'lost' | 'open') => {
    const res = await fetch(`/api/platform/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    if (res.ok) load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lead rescue — Tool 1 (TEST)</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Quotes older than 3 days with no follow-up are flagged <strong>neglected</strong>. Drafts are
        TEST stubs and enter the approval queue — nothing sends without your approval.
      </p>
      {notice && (
        <div style={{ ...card, borderColor: 'rgba(16,185,129,0.4)', marginBottom: 16, fontSize: 14 }}>
          {notice}
        </div>
      )}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading demo leads…</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {leads.map((l) => (
            <div key={l.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{l.customerName}</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    · {l.trade} · ${l.quoteAmount} · {l.status} · {l.outcome}
                  </span>
                </div>
                {l.neglected && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(239,68,68,0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.35)',
                    }}
                  >
                    NEGLECTED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  disabled={busy !== null || l.outcome !== 'open'}
                  onClick={() => draft(l.id, 'sms')}
                  style={btn}
                >
                  {busy === l.id + 'sms' ? 'Drafting…' : 'Draft SMS follow-up'}
                </button>
                <button
                  disabled={busy !== null || l.outcome !== 'open'}
                  onClick={() => draft(l.id, 'email')}
                  style={btn}
                >
                  {busy === l.id + 'email' ? 'Drafting…' : 'Draft email follow-up'}
                </button>
                <button disabled={busy !== null} onClick={() => setOutcome(l.id, 'won')} style={btnGhost}>
                  Mark won (TEST)
                </button>
                <button disabled={busy !== null} onClick={() => setOutcome(l.id, 'lost')} style={btnGhost}>
                  Mark lost (TEST)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  fontSize: 13,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
  fontSize: 13,
  cursor: 'pointer',
};
