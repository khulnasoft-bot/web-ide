/**
 * Inserts script into the document and waits for it to load
 */
export const insertScript = async (src: string, nonce = ''): Promise<HTMLScriptElement> => {
  const script = document.createElement('script');

  script.src = src;
  script.nonce = nonce;

  return new Promise((resolve, reject) => {
    script.onerror = reject;
    script.onload = () => resolve(script);

    document.head.appendChild(script);
  });
};
