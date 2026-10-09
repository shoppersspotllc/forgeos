/**
 * Pinterest API v5 — autonomous pin publishing
 *
 * Requires: PINTEREST_ACCESS_TOKEN (OAuth 2.0, scopes: pins:write, boards:read)
 * Get a token: Pinterest business account → developers.pinterest.com → create app →
 * OAuth authorize → Standard tier approval (for pins:write)
 *
 * API docs: https://developers.pinterest.com/docs/api/v5/
 */

const PINTEREST_API = 'https://api.pinterest.com/v5';

function getToken(): string {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error('PINTEREST_ACCESS_TOKEN not configured');
  return token;
}

export interface PinData {
  board_id: string;
  title: string;
  description: string;
  link: string;
  image_url: string;
  alt_text?: string;
}

export interface PinResult {
  success: boolean;
  pin_id?: string;
  error?: string;
}

/**
 * Create a single pin. Image must be publicly accessible via URL.
 */
export async function createPin(pin: PinData): Promise<PinResult> {
  const token = getToken();

  const body = {
    board_id: pin.board_id,
    title: pin.title.substring(0, 100),
    description: pin.description.substring(0, 500),
    link: pin.link,
    alt_text: pin.alt_text || pin.title.substring(0, 500),
    media_source: {
      source_type: 'image_url',
      url: pin.image_url,
      is_standard: true,
    },
  };

  const res = await fetch(`${PINTEREST_API}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`[pinterest] Pin created: ${data.id}`);
    return { success: true, pin_id: data.id };
  }

  const errText = await res.text();
  console.error(`[pinterest] Pin creation failed (${res.status}): ${errText.substring(0, 200)}`);
  return { success: false, error: `HTTP ${res.status}: ${errText.substring(0, 200)}` };
}

/**
 * List boards owned by the authenticated user.
 */
export async function listBoards(): Promise<{ id: string; name: string }[]> {
  const token = getToken();
  const res = await fetch(`${PINTEREST_API}/boards?page_size=25`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Boards fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map((b: any) => ({ id: b.id, name: b.name }));
}

/**
 * Get analytics for a pin (impressions, saves, clicks).
 * Requires pins:read scope.
 */
export async function getPinAnalytics(pinId: string): Promise<any> {
  const token = getToken();
  const params = new URLSearchParams({
    start_date: new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    metric_types: 'IMPRESSION,PIN_CLICK,SAVE,OUTBOUND_CLICK',
  });
  const res = await fetch(`${PINTEREST_API}/pins/${pinId}/analytics?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
}
