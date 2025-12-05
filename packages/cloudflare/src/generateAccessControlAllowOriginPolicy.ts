import './worker-configuration.d';

export function generateAccessControlAllowOriginPolicy(
  env: Env,
  origin: string | null,
): Record<string, string> {
  // Do not set a access-control-allow-origin header if ALLOWED_ORIGINS is not set
  if (typeof env.ALLOWED_ORIGINS !== 'string' || env.ALLOWED_ORIGINS.length === 0) {
    return {};
  }

  if (typeof origin !== 'string' || origin.length === 0) {
    return {};
  }

  const originMatchRegexp = new RegExp(`^${env.ALLOWED_ORIGINS.replace('*', '[^.]+')}$`);

  return originMatchRegexp.test(origin) ? { 'access-control-allow-origin': origin } : {};
}
