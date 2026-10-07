import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';
  
  try {
    const verRes = await fetch(`${base}/api/version`, { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!verRes.ok) throw new Error('Colibrì not responding');
    const verData = await verRes.json();

    const tagsRes = await fetch(`${base}/api/tags`, { 
      signal: AbortSignal.timeout(5000) 
    });
    const tagsData = tagsRes.ok ? await tagsRes.json() : { models: [] };
    
    const models = (tagsData.models || []).map((m: any) => ({
      name: m.name,
      sizeGB: (m.size / 1024 / 1024 / 1024).toFixed(1) + 'GB',
    }));

    return NextResponse.json({
      online: true,
      version: verData.version,
      runtime: 'Ollama',
      endpoint: base,
      cpu: true,
      gpu: false,
      models,
      modelCount: models.length,
      portable: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      error: 'Colibrì not available on this machine — install Ollama to enable local inference',
      endpoint: base,
      portable: true,
      setupUrl: 'https://ollama.com/download',
    }, { status: 503 });
  }
}
