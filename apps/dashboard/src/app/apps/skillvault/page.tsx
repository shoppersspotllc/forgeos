/**
 * SkillVault Landing Page
 * Premium specialist content and learning.
 */

import Link from 'next/link';

const COURSES = [
  {
    id: 'negotiation',
    name: 'Master Negotiation',
    price: 99,
    description: 'Advanced tactics from a former FBI negotiator. 12 modules.',
    instructor: 'Specialist: Negotiation',
  },
  {
    id: 'copywriting',
    name: 'Conversion Copywriting',
    price: 79,
    description: 'Write copy that sells. 8 modules + templates.',
    instructor: 'Specialist: Marketing',
  },
  {
    id: 'sysdesign',
    name: 'System Design Mastery',
    price: 149,
    description: 'Distributed systems for senior engineers. 15 modules.',
    instructor: 'Specialist: Engineering',
  },
];

export default function SkillVaultPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>SkillVault</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
        Specialist knowledge, unlocked. Premium courses from real practitioners.
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
        {COURSES.map((course) => (
          <div
            key={course.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>{course.name}</h3>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>{course.description}</p>
              <p style={{ margin: 0, fontSize: 14, color: '#888' }}>{course.instructor}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>${course.price}</div>
              <div style={{ fontSize: 12, color: '#888' }}>one-time</div>
              <Link
                href={`/apps/skillvault/enroll?course=${course.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '10px 24px',
                  background: '#0070f3',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Enroll
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 24 }}>
        <h3>How it works</h3>
        <ol style={{ color: '#555' }}>
          <li>Choose your course</li>
          <li>Enter your details</li>
          <li>Pay securely with Stripe (test mode)</li>
          <li>Get instant access to all modules</li>
        </ol>
        <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
          Test mode: no real course access is granted. Payments use Stripe test cards only.
        </p>
      </div>
    </div>
  );
}
