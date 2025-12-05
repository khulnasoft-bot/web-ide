/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly [string]: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
