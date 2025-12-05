// MIT License
//
// Copyright (c) 2022 Kot
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Source: https://github.com/kotx/render
import parseRange from 'range-parser';
import { generateAccessControlAllowOriginPolicy } from './generateAccessControlAllowOriginPolicy';

declare const DEBUG: boolean;

type ParsedRange = { offset: number; length: number } | { suffix: number };

function rangeHasLength(object: ParsedRange): object is { offset: number; length: number } {
  return (<{ offset: number; length: number }>object).length !== undefined;
}

function hasBody(object: R2Object | R2ObjectBody | undefined): object is R2ObjectBody {
  return object !== undefined && (<R2ObjectBody>object).body !== undefined;
}

function hasSuffix(range: ParsedRange): range is { suffix: number } {
  return (<{ suffix: number }>range).suffix !== undefined;
}

function getRangeHeader(range: ParsedRange, fileSize: number): string {
  return `bytes ${hasSuffix(range) ? fileSize - range.suffix : range.offset}-${
    hasSuffix(range) ? fileSize - 1 : range.offset + range.length - 1
  }/${fileSize}`;
}

function isHealthCheck(env: Env, url: URL): boolean {
  return (
    typeof env.HEALTHCHECK_PATH === 'string' &&
    env.HEALTHCHECK_PATH !== '' &&
    url.pathname === env.HEALTHCHECK_PATH
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
    const origin = request.headers.get('origin');

    if (allowedMethods.indexOf(request.method) === -1)
      return new Response('Method Not Allowed', { status: 405 });

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          allow: allowedMethods.join(', '),
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          ...generateAccessControlAllowOriginPolicy(env, origin),
          Vary: 'origin',
        },
      });
    }

    let triedIndex = false;

    const url = new URL(request.url);

    const healthCheck = isHealthCheck(env, url);
    if (healthCheck) {
      if (
        env.HEALTHCHECK_UA_REGEXP &&
        !request.headers.get('user-agent')?.match(env.HEALTHCHECK_UA_REGEXP)
      ) {
        return new Response('File Not Found', { status: 404 });
      }

      url.pathname = '/ping';
    }

    // Trim the first part of the request
    url.hostname = url.hostname.replace(/^[^.]+\./, '');

    let response: Response | undefined;

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`Request URL: ${url.toString()}`);
    }

    const shouldCache = env.CACHE_CONTROL !== 'no-store' && !healthCheck;
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    if (shouldCache) {
      response = await cache.match(cacheKey);
    }

    let range: ParsedRange | undefined;

    if (!response || !(response.ok || response.status === 304)) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn(`Cache MISS for ${url.toString()}`);
      }
      let path = (env.PATH_PREFIX || '') + decodeURIComponent(url.pathname);

      if (path.endsWith('/')) {
        if (env.INDEX_FILE && env.INDEX_FILE !== '') {
          path += env.INDEX_FILE;
          triedIndex = true;
        }
      }

      if (path !== '/' && path.startsWith('/')) {
        path = path.substring(1);
      }

      let file: R2Object | R2ObjectBody | null | undefined;

      // Range handling
      if (request.method === 'GET') {
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
          file = await env.R2_BUCKET.head(path);
          if (!file) return new Response('File Not Found', { status: 404 });
          const parsedRanges = parseRange(file.size, rangeHeader);
          // R2 only supports 1 range at the moment, reject if there is more than one
          if (
            parsedRanges !== -1 &&
            parsedRanges !== -2 &&
            parsedRanges.length === 1 &&
            parsedRanges.type === 'bytes'
          ) {
            const firstRange = parsedRanges[0];
            range =
              file.size === firstRange.end + 1
                ? { suffix: file.size - firstRange.start }
                : {
                    offset: firstRange.start,
                    length: firstRange.end - firstRange.start + 1,
                  };
          } else {
            return new Response('Range Not Satisfiable', { status: 416 });
          }
        }
      }

      // Etag/If-(Not)-Match handling
      // R2 requires that etag checks must not contain quotes, and the S3 spec only allows one etag
      // This silently ignores invalid or weak (W/) headers
      const getHeaderEtag = (header: string | null) => header?.trim().replace(/^['"]|['"]$/g, '');
      const ifMatch = getHeaderEtag(request.headers.get('if-match'));
      const ifNoneMatch = getHeaderEtag(request.headers.get('if-none-match'));

      const ifModifiedSince = Date.parse(request.headers.get('if-modified-since') || '');
      const ifUnmodifiedSince = Date.parse(request.headers.get('if-unmodified-since') || '');

      const ifRange = request.headers.get('if-range');
      if (range && ifRange && file) {
        const maybeDate = Date.parse(ifRange);

        if (Number.isNaN(maybeDate) || new Date(maybeDate) > file.uploaded) {
          // httpEtag already has quotes, no need to use getHeaderEtag
          if (ifRange.startsWith('W/') || ifRange !== file.httpEtag) range = undefined;
        }
      }

      if (ifMatch || ifUnmodifiedSince) {
        file = await env.R2_BUCKET.get(path, {
          onlyIf: {
            etagMatches: ifMatch,
            uploadedBefore: ifUnmodifiedSince ? new Date(ifUnmodifiedSince) : undefined,
          },
          range,
        });

        if (file && !hasBody(file)) {
          return new Response('Precondition Failed', { status: 412 });
        }
      }

      if (ifNoneMatch || ifModifiedSince) {
        // if-none-match overrides if-modified-since completely
        if (ifNoneMatch) {
          file = await env.R2_BUCKET.get(path, {
            onlyIf: { etagDoesNotMatch: ifNoneMatch },
            range,
          });
        } else if (ifModifiedSince) {
          file = await env.R2_BUCKET.get(path, {
            onlyIf: { uploadedAfter: new Date(ifModifiedSince) },
            range,
          });
        }
        if (file && !hasBody(file)) {
          return new Response(null, { status: 304 });
        }
      }

      if (request.method === 'HEAD') {
        file = await env.R2_BUCKET.head(path);
      } else if (!file || !hasBody(file)) {
        file = await env.R2_BUCKET.get(path, { range });
      }

      let notFound: boolean = false;

      if (file === null) {
        if (env.INDEX_FILE && triedIndex) {
          // remove the index file since it doesnt exist
          path = path.substring(0, path.length - env.INDEX_FILE.length);
        }

        if (env.NOTFOUND_FILE && env.NOTFOUND_FILE !== '') {
          notFound = true;
          path = env.NOTFOUND_FILE;
          file =
            request.method === 'HEAD'
              ? await env.R2_BUCKET.head(path)
              : await env.R2_BUCKET.get(path);
        }

        // if its still null, either 404 is disabled or that file wasn't found either
        // this isn't an else because then there would have to be two of them
        if (file == null) {
          return new Response('File Not Found', { status: 404 });
        }
      }

      let responseStatus;
      if (notFound) {
        responseStatus = 404;
      } else if (range) {
        responseStatus = 206;
      } else {
        responseStatus = 200;
      }

      let contentLength = file?.size;
      if (range && !notFound) {
        if (rangeHasLength(range)) {
          contentLength = range.length;
        } else if (range.suffix) {
          contentLength = range.suffix;
        }
      }

      response = new Response(hasBody(file) && file.size !== 0 ? file.body : null, {
        status: responseStatus,
        headers: {
          'accept-ranges': 'bytes',

          ...generateAccessControlAllowOriginPolicy(env, origin),

          etag: notFound ? '' : file?.httpEtag,
          // if the 404 file has a custom cache control, we respect it
          'cache-control':
            file?.httpMetadata?.cacheControl ??
            (notFound || healthCheck ? '' : env.CACHE_CONTROL || ''),
          expires: file?.httpMetadata?.cacheExpiry?.toUTCString() ?? '',
          'last-modified': notFound ? '' : file?.uploaded.toUTCString(),

          'content-encoding': file?.httpMetadata?.contentEncoding ?? '',
          'content-type': file?.httpMetadata?.contentType ?? 'application/octet-stream',
          'content-language': file?.httpMetadata?.contentLanguage ?? '',
          'content-disposition': file?.httpMetadata?.contentDisposition ?? '',
          'content-range': range && !notFound ? getRangeHeader(range, file?.size || 0) : '',
          'content-length': contentLength?.toString(),
          'cross-origin-resource-policy': 'cross-origin',
          Vary: 'origin',
        },
      });

      if (request.method === 'GET' && !range && shouldCache && !notFound)
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
    } else if (DEBUG) {
      // eslint-disable-next-line no-console
      console.info(`Cache HIT for ${url.toString()}`);
    }

    return response;
  },
};
