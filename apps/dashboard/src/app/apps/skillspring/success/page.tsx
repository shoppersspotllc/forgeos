'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px', fontFamily: 'system-ui', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
      <h1>Enrolled!</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Your payment was successful. Save this page for your records.</p>
      {sessionId && (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 24, wordBreak: 'break-all' }}>
          <div style={{ fontSize: 14, color: '#888' }}>Enrollment Reference</div>
          <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{sessionId}</div>
        </div>
      )}
      <div style={{ textAlign: 'left', background: '#fffbe6', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <strong>Test Mode Notice:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 14 }}>
          <li>No confirmation email is sent (not yet implemented)</li>
          <li>No real course access is granted</li>
          <li>This was a Stripe test transaction only</li>
        </ul>
      </div>
      <Link href="/apps/skillspring" style={{ color: '#7c3aed' }}>← Back to SkillSpring</Link>
    </div>
  );
}
