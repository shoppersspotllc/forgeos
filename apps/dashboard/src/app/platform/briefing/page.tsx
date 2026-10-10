'use client';

import { useEffect, useState } from 'react';

interface Section {
  title: string;
  source: string;
  freshness: string;
  period: string;
  lines: string[];
  missing: string[];
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 18,
};

const label: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)' };

export default function BriefingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/platform/briefing');
      const json = await res.json();
      setSections(json.data.sections ?? []);
      setGeneratedAt(json.data.generatedAt ?? '');
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Daily briefing — Tool 4 (TEST)</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Verified demo data only. Every section shows its source, freshness, and period — and says
        what is missing.
      </p>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Building briefing…</p>
      ) : (
        <>
          <p style={{ ...label, marginBottom: 16 }}>Generated: {generatedAt} · TEST demo data</p>
          <div style={{ display: 'grid', gap: 14 }}>
            {sections.map((s) => (
              <div key={s.title} style={card}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h2>
                <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 18, marginBottom: 10 }}>
                  {s.lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
                <div style={label}>Source: {s.source}</div>
                <div style={label}>Freshness: {s.freshness}</div>
                <div style={label}>Period: {s.period}</div>
                {s.missing.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#fbbf24' }}>
                    Missing data: {s.missing.join(' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
