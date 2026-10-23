import { omit } from 'lodash';
import type { ExampleConfigPayload } from './types';
import { isExampleConfigPayload, SENSITIVE_KEYS } from './types';

const STORAGE_KEY = 'gitlab.web-ide-example.config';

const cleanPayload = (payload: ExampleConfigPayload) => ({
  config: omit(payload.config, ...SENSITIVE_KEYS),
});

export const saveConfig = (payloadUnclean: ExampleConfigPayload) => {
  try {
    const payload = cleanPayload(payloadUnclean);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[gitlab-web-ide-example] Could not save user config!', e);
  }
};

export const loadConfig = (): ExampleConfigPayload | null => {
  const savedJson = localStorage.getItem(STORAGE_KEY);

  if (!savedJson) {
    return null;
  }

  try {
    const savedObj = JSON.parse(savedJson);

    if (isExampleConfigPayload(savedObj)) {
      return savedObj;
    }

    return null;
  } catch {
    return null;
  }
};
