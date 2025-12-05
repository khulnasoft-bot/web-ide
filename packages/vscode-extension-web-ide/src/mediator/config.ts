import type { WebIdeExtensionConfig } from '@gitlab/web-ide-types';
import { memoize } from 'lodash';
import { getExtensionContext } from '../context';
import { log } from '../utils';

export const MSG_CONFIG_NOT_FOUND =
  'Error: Config not found from within the Web IDE extension. This is irrecoverable and the Web IDE will not be functional.';
export const MSG_CONFIG_NOT_JSON =
  'Error: Config is not valid JSON. This is irrecoverable and the Web IDE will not be functional.';

// why: This is memoized because the config should never ever change
export const getConfig = memoize(async (): Promise<WebIdeExtensionConfig> => {
  const extensionContext = getExtensionContext();

  const json = await extensionContext.secrets.get('config');

  if (!json) {
    log.error(MSG_CONFIG_NOT_FOUND);
    throw new Error(MSG_CONFIG_NOT_FOUND);
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    log.error(MSG_CONFIG_NOT_JSON);
    throw new Error(`${MSG_CONFIG_NOT_JSON} ${e}`);
  }
});
