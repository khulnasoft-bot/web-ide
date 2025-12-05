interface Env {
  R2_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string;
  CACHE_CONTROL?: string;
  PATH_PREFIX?: string;
  INDEX_FILE?: string;
  NOTFOUND_FILE?: string;
  HEALTHCHECK_UA_REGEXP?: string;
  HEALTHCHECK_PATH?: string;
}
