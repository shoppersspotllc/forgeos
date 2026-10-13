/**
 * POST /api/publish/medium
 * Publish an article to Medium (autonomous).
 *
 * Body: { title, content, contentFormat?, tags?, canonicalUrl?, publishStatus? }
 * Requires MEDIUM_TOKEN env var. Defaults to draft for safety.
 */

import { NextRequest, NextResponse } from 'next/server';
import { publishArticle } from '@/lib/publish/medium';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, content, contentFormat, tags, canonicalUrl, publishStatus } = body;
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 });
  }
  if (content.length > 100000) {
    return NextResponse.json({ error: 'content too long (max 100k chars)' }, { status: 400 });
  }

  try {
    const result = await publishArticle({
      title: title.substring(0, 200),
      content,
      contentFormat: contentFormat === 'html' ? 'html' : 'markdown',
      tags,
      canonicalUrl,
      publishStatus: publishStatus === 'public' ? 'public' : 'draft',
    });
    return NextResponse.json(result, { status: result.success ? 201 : 500 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
