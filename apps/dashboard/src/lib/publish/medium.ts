/**
 * Medium API — autonomous article publishing
 *
 * Requires: MEDIUM_TOKEN (integration token from medium.com/me/settings/security)
 * Note: Medium has restricted new integration token issuance. If tokens are
 * unavailable, use OAuth2 app flow at medium.com/me/applications.
 *
 * API docs: https://github.com/Medium/medium-api-docs
 */

const MEDIUM_API = 'https://api.medium.com/v1';

function getToken(): string {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) throw new Error('MEDIUM_TOKEN not configured');
  return token;
}

export interface ArticleData {
  title: string;
  content: string; // markdown or HTML
  contentFormat?: 'markdown' | 'html';
  tags?: string[]; // max 5
  canonicalUrl?: string;
  publishStatus?: 'public' | 'draft' | 'unlisted';
}

export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function getUserId(token: string): Promise<string> {
  const res = await fetch(`${MEDIUM_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Medium auth failed: ${res.status}`);
  const data = await res.json();
  return data.data.id;
}

/**
 * Publish an article to Medium. Defaults to draft for safety —
 * pass publishStatus: 'public' to go live immediately.
 */
export async function publishArticle(article: ArticleData): Promise<PublishResult> {
  const token = getToken();
  const userId = await getUserId(token);

  const body: any = {
    title: article.title,
    contentFormat: article.contentFormat || 'markdown',
    content: article.content,
    tags: (article.tags || []).slice(0, 5),
    publishStatus: article.publishStatus || 'draft',
  };
  if (article.canonicalUrl) body.canonicalUrl = article.canonicalUrl;

  const res = await fetch(`${MEDIUM_API}/users/${userId}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`[medium] Article published: ${data.data.url}`);
    return { success: true, url: data.data.url };
  }

  const errText = await res.text();
  console.error(`[medium] Publish failed (${res.status}): ${errText.substring(0, 200)}`);
  return { success: false, error: `HTTP ${res.status}: ${errText.substring(0, 200)}` };
}
