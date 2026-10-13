/**
 * My Dots — Shared Chat Core
 *
 * Extracted from app/api/my-dots/chat/route.ts (behavior unchanged).
 * Used by both the JSON chat endpoint and the SSE streaming endpoint.
 *
 * All inference goes through ForgeOS AI. The service credential is held
 * server-side only (FORGEOS_MYDOTS_KEY env var, never in browser code).
 */

import {
  executeCapability,
  isCapabilityAllowed,
  getAllowedCapabilities,
  buildToolGuide,
} from '@/lib/capabilities/executor';

const FORGEOS_AI_CHAT = 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat';
const GATEWAY_TIMEOUT_MS = 45000;
const MAX_TOOL_ROUNDS = 2;

// Known Dot personas (server-side source of truth).
export const DOT_PERSONAS: Record<
  string,
  { role: string; specialty: string; capability: string }
> = {
  Scout: { role: 'Research Specialist', specialty: 'Market intelligence & discovery', capability: 'chat' },
  Analyst: { role: 'Data Analyst', specialty: 'Deep analysis & insights', capability: 'chat' },
  Craftsman: { role: 'Build Engineer', specialty: 'Implementation & construction', capability: 'chat' },
  Hunter: { role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', capability: 'chat' },
  Shepherd: { role: 'Relationship Manager', specialty: 'Nurturing & follow-up', capability: 'chat' },
  Closer: { role: 'Deal Closer', specialty: 'Final conversion & revenue', capability: 'chat' },
  MediaPilot: { role: 'Content Producer', specialty: 'Media briefs & publishing prep', capability: 'chat' },
};

// Per-Dot capability descriptions (enforcement is in the executor's permission map)
const DOT_CAPABILITIES: Record<string, string> = {
  Scout: 'Full research access: web-search, web-read, github-research, youtube-transcript, reddit, rss.',
  Analyst: 'Research access: web-search, web-read, github-research. Focus on data analysis and insights.',
  Craftsman: 'Research access: web-search, web-read, github-research. Focus on implementation docs.',
  Hunter: 'Research access: web-search, reddit. Focus on lead discovery and market signals.',
  Shepherd: 'Research access: web-search. Focus on relationship context.',
  Closer: 'Research access: web-search. Focus on deal-relevant intelligence.',
  MediaPilot: 'Research access: web-search, web-read. Focus on content research.',
};

const TOOLCALL_RE = /```toolcall\s*\n([\s\S]*?)\n```/;
const STRIP_TOOLCALL_RE = /```toolcall\s*\n[\s\S]*?\n```/g;

export interface ToolTraceEntry {
  capability: string;
  operation: string;
  params: any;
  success: boolean;
  denied?: boolean;
  error?: string;
  resultSummary?: string;
}

export function getServiceKey(): string | null {
  return process.env.FORGEOS_MYDOTS_KEY || null;
}

export function getDotPersona(dotName: string) {
  return (
    DOT_PERSONAS[dotName] || {
      role: 'AI Assistant',
      specialty: 'General assistance',
      capability: 'chat',
    }
  );
}

export function buildSystemPrompt(dotName: string): string {
  const persona = getDotPersona(dotName);
  const toolGuide = buildToolGuide(dotName);
  const capabilities = DOT_CAPABILITIES[dotName] || 'General assistance.';
  return `You are ${dotName}, a ${persona.role} in the ForgeOS AI workforce. Specialty: ${persona.specialty}. Respond as ${dotName} would.

${capabilities}

YOUR ASSIGNED RESEARCH TOOLS (executed server-side — you never call HTTP yourself):
${toolGuide}

CRITICAL — HOW TO USE TOOLS (follow exactly):
When the user asks anything requiring live/current/factual data, your ENTIRE response must be EXACTLY ONE tool-call block and nothing else. Do NOT narrate. Output ONLY the block:

\`\`\`toolcall
{"capability": "web-search", "operation": "search", "params": {"query": "..."}}
\`\`\`

Adapt the capability/operation/params to the question, using ONLY your assigned tools above.
`;
}

async function callForgeosAi(
  serviceKey: string,
  messages: any[],
  capability: string,
): Promise<any> {
  const res = await fetch(FORGEOS_AI_CHAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ messages, capability }),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `ForgeOS AI request failed (${res.status})`);
  }
  return data;
}

export function extractAssistantText(data: any): string {
  if (!data || typeof data !== 'object') return '';
  const choices = (data as any).choices;
  if (Array.isArray(choices) && choices[0]) {
    const msg = choices[0].message;
    if (msg) {
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        return msg.content
          .filter((p: any) => p && p.type === 'text')
          .map((p: any) => String(p.text || ''))
          .join('\n');
      }
    }
    if (typeof choices[0].text === 'string') return choices[0].text;
  }
  if (typeof (data as any).reply === 'string') return (data as any).reply;
  if (typeof (data as any).content === 'string') return (data as any).content;
  return '';
}

function parseToolCall(text: string, dotName: string) {
  const m = TOOLCALL_RE.exec(text || '');
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    return {
      capability: String(parsed.capability || ''),
      operation: String(parsed.operation || ''),
      params: parsed.params || {},
    };
  } catch {
    return null;
  }
}

export interface ChatResult {
  text: string;
  toolTrace: ToolTraceEntry[];
  raw: any;
}

/**
 * Run a Dot conversation turn through ForgeOS AI, with agentic tool loop.
 * Returns the final assistant text and tool execution trace.
 */
export async function runDotChat(
  serviceKey: string,
  dotName: string,
  messages: any[],
): Promise<ChatResult> {
  const persona = getDotPersona(dotName);
  const capability = persona.capability;
  const hasTools = getAllowedCapabilities(dotName).length > 0;

  // Prepend system prompt
  const convo: any[] = [
    { role: 'system', content: buildSystemPrompt(dotName) },
    ...messages,
  ];

  if (!hasTools) {
    const data = await callForgeosAi(serviceKey, convo, capability);
    return { text: extractAssistantText(data), toolTrace: [], raw: data };
  }

  // Agentic tool loop (bounded)
  const toolTrace: ToolTraceEntry[] = [];
  let gatewayData: any = null;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    gatewayData = await callForgeosAi(serviceKey, convo, capability);
    const text = extractAssistantText(gatewayData);
    const tc = round < MAX_TOOL_ROUNDS ? parseToolCall(text, dotName) : null;
    if (!tc) break;

    if (!isCapabilityAllowed(dotName, tc.capability)) {
      const allowed = getAllowedCapabilities(dotName);
      toolTrace.push({
        capability: tc.capability,
        operation: tc.operation,
        params: tc.params,
        success: false,
        denied: true,
        error: `Capability '${tc.capability}' not assigned to ${dotName}`,
      });
      convo.push({ role: 'assistant', content: text });
      convo.push({
        role: 'user',
        content: `[TOOL DENIED] '${tc.capability}' is not in your assigned capabilities (${allowed.join(', ')}). Do not try it again. Answer from your own knowledge or say the information could not be verified.`,
      });
      continue;
    }

    try {
      const result = await executeCapability(tc.capability, tc.operation, tc.params);
      const summary = JSON.stringify(result).substring(0, 6000);
      toolTrace.push({
        capability: tc.capability,
        operation: tc.operation,
        params: tc.params,
        success: true,
        resultSummary: summary.substring(0, 300),
      });
      convo.push({ role: 'assistant', content: text });
      convo.push({
        role: 'user',
        content: `[TOOL RESULT — ${tc.capability}/${tc.operation}]\n${summary}\n\nUse this data in your final answer. Cite specific facts. Do not invent anything beyond what the tool returned. Give your final answer now.`,
      });
    } catch (e: any) {
      const msg = (e && e.message) || 'tool execution failed';
      toolTrace.push({
        capability: tc.capability,
        operation: tc.operation,
        params: tc.params,
        success: false,
        error: msg,
      });
      convo.push({ role: 'assistant', content: text });
      convo.push({
        role: 'user',
        content: `[TOOL ERROR — ${tc.capability}/${tc.operation}] ${msg}\nAcknowledge briefly, then answer from your own knowledge or say it could not be verified. Do not retry.`,
      });
    }
  }

  // Strip unexecuted toolcall blocks from user-visible text
  let finalText = extractAssistantText(gatewayData);
  if (STRIP_TOOLCALL_RE.test(finalText)) {
    const cleaned = finalText.replace(STRIP_TOOLCALL_RE, '').trim();
    if (cleaned) finalText = cleaned;
  }

  return { text: finalText, toolTrace, raw: gatewayData };
}
