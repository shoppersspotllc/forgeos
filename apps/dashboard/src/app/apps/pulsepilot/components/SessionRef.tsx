'use client';

/**
 * PulsePilot SessionRef — renders the Stripe session reference chip.
 * Client-side read of searchParams so the success page stays statically
 * prerenderable (Next 16 cacheComponents-compatible).
 */
import { useSearchParams } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function SessionRef() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  if (!sessionId) return null;
  return (
    <div>
      <span className="pp-ref">
        <Activity size={14} /> Reference: {sessionId.substring(0, 20)}…
      </span>
    </div>
  );
}
