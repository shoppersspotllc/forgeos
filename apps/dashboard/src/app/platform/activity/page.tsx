'use client';

import { useEffect, useState } from 'react';

interface ActivityRecord {
  ts: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

interface AuditRecord {
  ts: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  evidence: string;
  approval: string;
  mode: string;
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 12,
  fontSize: 13,
};

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/platform/activity');
      const json = await res.json();
      setActivity(json.data.activity ?? []);
      setAudit(json.data.audit ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Activity & audit (TEST)</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Append-only history. Every entry is a TEST demo record.
      </p>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            Activity ({activity.length})
          </h2>
          <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
            {activity.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                No activity yet — draft a follow-up from the Lead Rescue page.
              </p>
            )}
            {activity.map((a, i) => (
              <div key={i} style={card}>
                <strong>{a.action}</strong> · {a.actor} · {a.target}
                <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{a.detail}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{a.ts}</div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Audit log ({audit.length})</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {audit.map((a, i) => (
              <div key={i} style={{ ...card, fontFamily: 'monospace', fontSize: 12 }}>
                [{a.ts}] {a.actor} · {a.action} · {a.target} · result={a.result} · mode={a.mode}
                <div style={{ color: 'var(--text-secondary)' }}>evidence: {a.evidence}</div>
                <div style={{ color: 'var(--text-secondary)' }}>approval: {a.approval}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
