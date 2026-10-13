import { gatewayProviders } from '@/lib/forgeos-ai/gateway-dual';

export async function GET() {
  return gatewayProviders();
}
