const TOOLS = [
  {
    name: 'Lead Conversion & Follow-up',
    desc: 'Neglected-quote rescue: detect stalled quotes, draft follow-ups, approve, track outcomes.',
    state: 'MVP active (TEST)',
    href: '/platform/leads',
  },
  {
    name: 'Customer Retention & Appointments',
    desc: 'Reminders, confirmations, rescheduling, repeat-customer follow-ups.',
    state: 'Designed — builds after MVP validation',
    href: '/platform/activity',
  },
  {
    name: 'AI Marketing & Acquisition',
    desc: 'Market research, plans, SEO content, campaign drafts with approval workflows.',
    state: 'Designed — builds after MVP validation',
    href: '/platform/activity',
  },
  {
    name: 'Business Intelligence',
    desc: 'Daily briefing: what happened, what needs follow-up, where attention leaks, priorities.',
    state: 'MVP active (TEST)',
    href: '/platform/briefing',
  },
  {
    name: 'Reliability & Protection',
    desc: 'Workflow health checks, failure alerts, audit trails, evidence-backed incident summaries.',
    state: 'MVP slice active (TEST)',
    href: '/platform/activity',
  },
];

const DOTS = [
  'Growth Dot — lead conversion and follow-up',
  'Customer Operations Dot — retention and appointments',
  'Marketing Dot — acquisition and campaigns',
  'Business Intelligence Dot — reporting and revenue optimization',
  'Reliability Dot — workflow health and operational incidents',
];

export default function PlatformHome() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Business overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 680 }}>
        One workspace for five connected capabilities. Specialist Dots do the work; you approve
        anything consequential. Every number below is TEST demo data — nothing here is a real
        customer or a real message.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {TOOLS.map((t) => (
          <a
            key={t.name}
            href={t.href}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{t.desc}</div>
            <span
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                background: t.state.startsWith('MVP') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                color: t.state.startsWith('MVP') ? '#34d399' : '#fbbf24',
                border: '1px solid var(--border)',
              }}
            >
              {t.state}
            </span>
          </a>
        ))}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '32px 0 12px' }}>Your specialist Dots</h2>
      <ul style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.9, paddingLeft: 20 }}>
        {DOTS.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
        Dot instruction files with responsibilities, KPIs, and escalation rules are prepared separately.
        Dots never claim work complete from a plan or draft alone.
      </p>
    </div>
  );
}
