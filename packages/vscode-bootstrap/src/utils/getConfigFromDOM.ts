import type { SerializableConfig } from '@gitlab/web-ide-types';
import { createError } from './error';

const CONFIG_EL_ID = 'gl-config-json';

export const getConfigFromDOM = <T extends SerializableConfig>(): T => {
  const el = document.getElementById(CONFIG_EL_ID);

  if (!el) {
    throw createError(`Could not find element for config in document (${CONFIG_EL_ID}).`);
  }

  const json = el.dataset.settings;

  if (!json) {
    throw createError(`Could not find "data-settings" in config element (${CONFIG_EL_ID}).`);
  }

  return JSON.parse(json);
};
