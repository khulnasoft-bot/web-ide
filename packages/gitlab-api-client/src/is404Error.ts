const isRecord = (err: unknown): err is Record<string, unknown> =>
  Boolean(err && typeof err === 'object');

export const is404Error = (err: unknown): boolean => {
  if (!isRecord(err)) {
    return false;
  }

  // note: Let's intentionally be resilient here and check for both 'status' and 'message'
  if ('status' in err) {
    return String(err.status) === '404';
  }

  if ('message' in err) {
    return /404/.test(String(err.message));
  }

  return false;
};
