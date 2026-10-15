import { NextRequest, NextResponse } from 'next/server';
import { gatewayProvidersCheck } from '@/lib/forgeos-ai/gateway-dual';
import { checkAdmin } from '@/lib/forgeos-ai/admin-auth';

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
  }
  return gatewayProvidersCheck();
}
