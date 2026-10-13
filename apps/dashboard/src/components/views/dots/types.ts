/**
 * Shared types for the native Dots workspace.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  input: string;
  output: string;
  durationMs: number;
  status: 'running' | 'success' | 'error';
}

export interface Thread {
  id: string;
  dotName: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const STORAGE_KEY = 'forgeos-dots-threads-v2';

export function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 30)));
  } catch {
    // storage full or unavailable — non-fatal
  }
}

// Migrate v1 threads (from the basic DotsChatView) to v2 format
export function migrateV1Threads(): Thread[] {
  try {
    const raw = localStorage.getItem('forgeos-dots-threads-v1');
    if (!raw) return [];
    const v1 = JSON.parse(raw);
    if (!Array.isArray(v1)) return [];
    return v1.map((t: Record<string, unknown>) => ({
      id: String(t.id ?? crypto.randomUUID()),
      dotName: String(t.dotName ?? 'Scout'),
      title: String(t.title ?? 'Conversation'),
      messages: Array.isArray(t.messages)
        ? (t.messages as Record<string, unknown>[]).map((m) => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as ChatMessage['role'],
            content: String(m.content ?? ''),
            timestamp: Number(m.timestamp ?? Date.now()),
          }))
        : [],
      createdAt: Number(t.createdAt ?? Date.now()),
      updatedAt: Number(t.updatedAt ?? Date.now()),
    }));
  } catch {
    return [];
  }
}
