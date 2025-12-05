export const encodeBase64 = (content: string): string => {
  const bytes = new TextEncoder().encode(content);

  const binString = String.fromCodePoint(...bytes);

  return btoa(binString);
};

export const decodeBase64 = (encoded: string): string => {
  const binString = atob(encoded);
  const bytes = Uint8Array.from(binString, m => m.codePointAt(0) || 0);
  const content = new TextDecoder().decode(bytes);

  return content;
};
