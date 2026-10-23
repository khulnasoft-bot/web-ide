function getHandshakeStateKey(clientId: string) {
  return `gitlab/web-ide/oauth/${clientId}/handshake`;
}

// PLEASE NOTE: This approach violates the encapsulate of the Web IDE
// but we're justifying it here since this is developer tooling.
// https://gitlab.com/gitlab-org/gitlab-web-ide/-/merge_requests/259#note_1643865691
export function getHandshakeState(clientId: string) {
  const handshakeKey = getHandshakeStateKey(clientId);
  const handshakeStateRaw = localStorage.getItem(handshakeKey);

  if (!handshakeStateRaw) {
    return null;
  }

  return JSON.parse(atob(handshakeStateRaw));
}

export function setHandshakeState(clientId: string, value: unknown) {
  const handshakeKey = getHandshakeStateKey(clientId);
  const handshakeStateRaw = btoa(JSON.stringify(value));

  localStorage.setItem(handshakeKey, handshakeStateRaw);
}

export function addParamsToOriginalUrl(clientId: string, params: Record<string, string>) {
  try {
    const handshakeState = getHandshakeState(clientId);
    const originalUrl = new URL(handshakeState.originalUrl);
    Object.entries(params).forEach(([key, value]) => {
      originalUrl.searchParams.set(key, value);
    });
    handshakeState.originalUrl = originalUrl.href;

    setHandshakeState(clientId, handshakeState);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to adjust originalUrl in handshake state!', e);
  }
}
