import { gatewayHealth } from '@/lib/forgeos-ai/gateway-dual';

export async function GET() {
  return gatewayHealth();
}
