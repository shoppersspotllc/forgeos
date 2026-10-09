/**
 * POST /api/publish/pinterest
 * Publish a pin to Pinterest (autonomous).
 *
 * Body: { board_id, title, description, link, image_url, alt_text? }
 * Requires PINTEREST_ACCESS_TOKEN env var.
 *
 * Rate limits: respect Pinterest's limits — max ~5 pins/day for new accounts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPin, listBoards } from '@/lib/publish/pinterest';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // List boards mode
  if (body.action === 'list_boards') {
    try {
      const boards = await listBoards();
      return NextResponse.json({ success: true, boards });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  const { board_id, title, description, link, image_url, alt_text } = body;
  if (!board_id || !title || !link || !image_url) {
    return NextResponse.json(
      { error: 'board_id, title, link, image_url required' },
      { status: 400 }
    );
  }

  try {
    const result = await createPin({ board_id, title, description: description || '', link, image_url, alt_text });
    return NextResponse.json(result, { status: result.success ? 201 : 500 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
