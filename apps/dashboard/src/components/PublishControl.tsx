'use client';

import { useState, useEffect } from 'react';

interface PublishStatus {
  branch: string;
  remote: string;
  hasChanges: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
  lastCommit: string;
  canPublish: boolean;
  blockers: string[];
}

export default function PublishControl() {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const res = await fetch('/api/deploy/publish');
    const data = await res.json();
    setStatus(data);
  };

  const handlePublish = async () => {
    if (!confirm('Publish to production? This will commit, push, and deploy.')) return;
    
    setPublishing(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/deploy/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message || 'ForgeOS one-click publish' }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) fetchStatus();
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setPublishing(false);
    }
  };

  if (!status) return <div className="p-4">Loading publish status...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">One-Click Publish</h2>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-400">Branch:</div>
          <div className="font-mono">{status.branch}</div>
          <div className="text-gray-400">Last commit:</div>
          <div className="font-mono text-xs">{status.lastCommit}</div>
          <div className="text-gray-400">Changes:</div>
          <div>
            {status.hasChanges 
              ? `${status.staged} staged, ${status.unstaged} unstaged, ${status.untracked} untracked`
              : 'No pending changes'}
          </div>
        </div>
      </div>

      {status.blockers.length > 0 && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-red-400 mb-2">Blockers:</h3>
          <ul className="list-disc list-inside text-sm">
            {status.blockers.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Commit message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ForgeOS one-click publish"
          className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handlePublish}
        disabled={publishing || !status.canPublish}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg"
      >
        {publishing ? 'Publishing...' : '🚀 Publish to Production'}
      </button>

      {result && (
        <div className={`mt-4 rounded-lg p-4 ${result.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
          <h3 className="font-bold mb-2">{result.success ? '✓ Published' : '✗ Failed'}</h3>
          {result.sha && <div className="text-sm font-mono">Commit: {result.sha}</div>}
          {result.error && <div className="text-sm text-red-300 mt-2">{result.error}</div>}
          {result.log && (
            <pre className="text-xs mt-2 whitespace-pre-wrap">{result.log.join('\n')}</pre>
          )}
        </div>
      )}
    </div>
  );
}
