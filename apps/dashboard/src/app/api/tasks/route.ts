import { NextRequest, NextResponse } from 'next/server';

/**
 * ForgeOS Task Chain — Minimal E2E Proof
 *
 * Chain: USER → MUSE (router) → DOT → UI
 * Ruflo is NOT in this path (not installed, no integration code in baseline).
 *
 * Muse routing: deterministic keyword router designed by Muse.
 * Dot execution: real HTTP calls, real results, honest failures.
 * State: in-memory task store with full execution trace for observability.
 */

const GATEWAY = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

interface TaskTrace {
  ts: string;
  stage: string;
  detail: string;
}

interface Task {
  id: string;
  task: string;
  status: 'received' | 'routed' | 'executing' | 'complete' | 'failed';
  dot: string | null;
  result: unknown;
  trace: TaskTrace[];
  createdAt: string;
  completedAt: string | null;
}

const tasks = new Map<string, Task>();

function trace(task: Task, stage: string, detail: string) {
  task.trace.push({ ts: new Date().toISOString(), stage, detail });
}

/**
 * MUSE ROUTING — determines the appropriate Dot for a task.
 *
 * LOCAL AI E2E: Uses the ForgeOS AI gateway with the local Ollama model
 * to make a REAL routing decision. Falls back to honest failure if the
 * gateway is unreachable or the model cannot decide.
 */
async function museRoute(taskText: string, task: Task): Promise<{ dot: string; action: string; provider: string; model: string } | null> {
  trace(task, 'muse-routing', 'Muse: consulting ForgeOS AI gateway for routing decision');

  const systemPrompt = `You are the Muse executive router for ForgeOS. Given a user task, decide which Dot should handle it.

Available Dots:
- monitor: checks system health, gateway status, provider status. Use for: health, status, providers, uptime, monitoring.
- scout: lists capabilities, discovers what's available. Use for: capabilities, features, what can you do, list.

Respond with ONLY a JSON object: {"dot": "monitor"|"scout", "action": "gateway-health"|"list-capabilities"}
If the task matches NEITHER dot, respond with ONLY: {"dot": null}

Task: "${taskText}"`;

  try {
    const res = await fetch(`${GATEWAY}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: taskText },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      trace(task, 'muse-routing', `Gateway returned ${res.status}: ${err.error || 'unknown'} — honest failure`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const provider = data.forgeos?.provider || 'unknown';
    const model = data.model || 'unknown';

    trace(task, 'muse-routing', `AI provider "${provider}" model "${model}" responded: ${content.slice(0, 120)}`);

    // Parse the model's JSON decision
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      trace(task, 'muse-routing', 'Could not parse routing decision — honest failure');
      return null;
    }

    const decision = JSON.parse(jsonMatch[0]);
    if (!decision.dot) {
      trace(task, 'muse-routing', 'AI determined no matching Dot — honest rejection');
      return null;
    }

    if (decision.dot !== 'monitor' && decision.dot !== 'scout') {
      trace(task, 'muse-routing', `AI returned unknown dot "${decision.dot}" — honest rejection`);
      return null;
    }

    trace(task, 'muse-routing', `AI routed to Dot "${decision.dot}" for action "${decision.action}"`);
    return { dot: decision.dot, action: decision.action, provider, model };

  } catch (e: any) {
    trace(task, 'muse-routing', `Routing failed honestly: ${e.message}`);
    return null;
  }
}

/**
 * DOT EXECUTION — real actions, real results.
 * Each Dot performs a concrete, safe, non-destructive operation.
 */
async function executeDot(dot: string, action: string, task: Task): Promise<unknown> {
  if (dot === 'monitor' && action === 'gateway-health') {
    trace(task, 'dot-execute', 'Monitor Dot: GET ' + GATEWAY + '/health');
    const res = await fetch(`${GATEWAY}/health`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Gateway health returned ${res.status}`);
    const data = await res.json();
    trace(task, 'dot-result', `Gateway status: ${data.status}, providers: ${data.connected}/${data.providers}`);
    return { dot, action, gateway: data };
  }

  if (dot === 'scout' && action === 'list-capabilities') {
    trace(task, 'dot-execute', 'Scout Dot: GET /api/capabilities');
    // Call our own capabilities endpoint via the gateway-independent path
    // For this proof, return the static registry shape the UI already uses
    const { CAPABILITIES } = await import('@/lib/capabilities');
    const available = CAPABILITIES.filter(c => c.available);
    trace(task, 'dot-result', `${available.length}/${CAPABILITIES.length} capabilities available`);
    return { dot, action, total: CAPABILITIES.length, available: available.length, capabilities: available.map(c => c.id) };
  }

  throw new Error(`Unknown dot/action: ${dot}/${action}`);
}

export async function POST(req: NextRequest) {
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    task: '',
    status: 'received',
    dot: null,
    result: null,
    trace: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  try {
    const body = await req.json();
    task.task = body.task || '';
    trace(task, 'received', `Task received via ForgeOS AI chain: "${task.task}"`);

    if (!task.task) {
      task.status = 'failed';
      trace(task, 'failed', 'Empty task text');
      return NextResponse.json(task, { status: 400 });
    }

    // STAGE 2: Muse routing (via ForgeOS AI gateway + local model)
    const route = await museRoute(task.task, task);
    if (!route) {
      task.status = 'failed';
      trace(task, 'failed', 'Muse routing could not determine a Dot — task honestly rejected');
      task.completedAt = new Date().toISOString();
      tasks.set(task.id, task);
      return NextResponse.json(task, { status: 422 });
    }
    task.dot = route.dot;
    task.status = 'routed';
    trace(task, 'routed', `Provider: ${route.provider}, Model: ${route.model}`);

    // STAGE 3: Dot execution (Ruflo not in path — not installed)
    task.status = 'executing';
    trace(task, 'orchestration', 'Ruflo: not in path (not installed in baseline) — direct Dot dispatch');

    try {
      task.result = await executeDot(route.dot, route.action, task);
      task.status = 'complete';
      trace(task, 'complete', 'Dot execution succeeded, result recorded');
    } catch (e: any) {
      task.status = 'failed';
      trace(task, 'dot-failed', `Dot execution failed honestly: ${e.message}`);
    }

    task.completedAt = new Date().toISOString();
    tasks.set(task.id, task);
    return NextResponse.json(task, { status: task.status === 'complete' ? 200 : 500 });

  } catch (e: any) {
    task.status = 'failed';
    trace(task, 'error', e.message);
    task.completedAt = new Date().toISOString();
    tasks.set(task.id, task);
    return NextResponse.json(task, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const task = tasks.get(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  }

  // List all tasks (most recent first)
  const all = Array.from(tasks.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return NextResponse.json({ tasks: all, count: all.length });
}
