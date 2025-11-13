// app/web/modules/system/index.ts
import { config } from '@/lib/config/env';

export function getSystemInfo() {
  return {
    service: config.serviceName,
    env: config.appEnv,
    ts: new Date().toISOString(),
  };
}
