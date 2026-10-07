'use client';

import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';

export function ColibriView() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/colibri/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ online: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-zinc-500" /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Cpu className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Colibrì</h1>
          <p className="text-zinc-400">Local lightweight intelligence</p>
        </div>
        <span className={`ml-auto flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${status?.online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
          {status?.online ? <><CheckCircle className="h-3.5 w-3.5" /> ONLINE</> : <><XCircle className="h-3.5 w-3.5" /> NOT INSTALLED</>}
        </span>
      </div>

      {!status?.online ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <Cpu className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
          <p className="text-white font-medium mb-2">Ollama not detected on this machine</p>
          <p className="text-sm text-zinc-400 mb-4">Install Ollama to enable local AI inference via Colibrì.</p>
          <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm">
            <Download className="h-4 w-4" /> Download Ollama
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-500 mb-1">Version</p>
            <p className="text-lg font-mono text-white">{status.version}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-500 mb-1">Models</p>
            <p className="text-lg text-white">{status.modelCount}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-zinc-400 mb-2">Available Models</p>
            {status.models?.map((m: any) => (
              <div key={m.name} className="flex justify-between py-1 text-sm">
                <span className="font-mono text-white">{m.name}</span>
                <span className="text-zinc-500">{m.sizeGB}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
