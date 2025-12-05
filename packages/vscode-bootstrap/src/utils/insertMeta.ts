// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const insertMeta = (id: string, jsonSetting: any): HTMLElement => {
  const meta = document.createElement('meta');

  meta.id = id;
  meta.setAttribute('data-settings', JSON.stringify(jsonSetting));

  document.head.appendChild(meta);

  return meta;
};
