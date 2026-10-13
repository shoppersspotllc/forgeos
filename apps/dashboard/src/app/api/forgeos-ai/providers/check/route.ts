import { gatewayProvidersCheck } from '@/lib/forgeos-ai/gateway-dual';

export async function POST() {
  return gatewayProvidersCheck();
}
