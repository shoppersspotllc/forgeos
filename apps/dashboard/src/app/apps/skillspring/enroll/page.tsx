'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const COURSES = [
  { id: 'negotiation', name: 'Master Negotiation', price: 99 },
  { id: 'copywriting', name: 'Conversion Copywriting', price: 79 },
  { id: 'sysdesign', name: 'System Design Mastery', price: 149 },
];

export default function EnrollPage() {
  const searchParams = useSearchParams();
  const [courseId, setCourseId] = useState(searchParams.get('course') || 'negotiation');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const course = COURSES.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/apps/skillspring/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, customer: { name, email } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, marginBottom: 12 };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1>Enroll</h1>
      <h3>Select Course</h3>
      {COURSES.map((c) => (
        <label key={c.id} style={{ display: 'block', padding: 12, border: courseId === c.id ? '2px solid #7c3aed' : '1px solid #ddd', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
          <input type="radio" checked={courseId === c.id} onChange={() => setCourseId(c.id)} style={{ marginRight: 8 }} />
          {c.name} — <strong>${c.price}</strong>
        </label>
      ))}
      <h3>Your Details</h3>
      <form onSubmit={handleSubmit}>
        <input style={inputStyle} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, fontSize: 18, background: loading ? '#ccc' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Processing...' : `Enroll $${course?.price}`}
        </button>
      </form>
      <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>Test mode: use card 4242 4242 4242 4242. No real access granted.</p>
    </div>
  );
}
