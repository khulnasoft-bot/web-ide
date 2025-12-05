/* eslint-disable max-classes-per-file */
import type {
  EndpointMethod,
  DefaultPathParams,
  PathParams,
  DefaultReturnType,
  DefaultBodyParams,
  GetEndpoint,
  GetBufferEndpoint,
  PostEndpoint,
  DeleteEndpoint,
} from '../types';
import { resolvePathParams } from './resolvePathParams';

// region: builder classes ---------------------------------------------

class BaseEndpointBuilder {
  protected path: string;

  constructor(path: string) {
    this.path = path;
  }
}

// region: builder classes (POST) --------------------------------------

class PostEndpointBuilder<
  TReturnType = DefaultReturnType,
  TPathParams extends PathParams = DefaultPathParams,
  TBodyParams = DefaultBodyParams,
> extends BaseEndpointBuilder {
  withReturnType<X>(): PostEndpointBuilder<X, TPathParams, TBodyParams> {
    return this;
  }

  withPathParams<X extends PathParams>(): PostEndpointBuilder<TReturnType, X, TBodyParams> {
    // what: Cast to unknown first since TS doesn't like us changing a generic.
    // why: This is safe because we don't actually "use" the generic until "build".
    return this as unknown as PostEndpointBuilder<TReturnType, X, TBodyParams>;
  }

  withBodyType<X>(): PostEndpointBuilder<TReturnType, TPathParams, X> {
    // what: Cast to unknown first since TS doesn't like us changing a generic.
    // why: This is safe because we don't actually "use" the generic until "build".
    return this as unknown as PostEndpointBuilder<TReturnType, TPathParams, X>;
  }

  build(): PostEndpoint<TReturnType, TPathParams, TBodyParams> {
    // what: Pull variables out of `this` so they are owned by createRequest closure
    const { path } = this;

    return {
      createRequest(params: TPathParams, body: TBodyParams, headers?: Record<string, string>) {
        return {
          type: 'rest',
          method: 'POST',
          path: resolvePathParams(path, params),
          body,
          ...(headers && { headers }),
        };
      },
    };
  }
}

// region: builder classes (DELETE) ------------------------------------

class DeleteEndpointBuilder<
  TReturnType = DefaultReturnType,
  TPathParams extends PathParams = DefaultPathParams,
> extends BaseEndpointBuilder {
  withReturnType<X>(): DeleteEndpointBuilder<X, TPathParams> {
    return this;
  }

  withPathParams<X extends PathParams>(): DeleteEndpointBuilder<TReturnType, X> {
    // what: Cast to unknown first since TS doesn't like us changing a generic.
    // why: This is safe because we don't actually "use" the generic until "build".
    return this as unknown as DeleteEndpointBuilder<TReturnType, X>;
  }

  build(): DeleteEndpoint<TReturnType, TPathParams> {
    // what: Pull variables out of `this` so they are owned by createRequest closure
    const { path } = this;

    return {
      createRequest(params: TPathParams, headers?: Record<string, string>) {
        return {
          type: 'rest',
          method: 'DELETE',
          path: resolvePathParams(path, params),
          ...(headers && { headers }),
        };
      },
    };
  }
}

// region: builder classes (GET BUFFER) --------------------------------

class GetBufferEndpointBuilder<
  TPathParams extends PathParams = DefaultPathParams,
> extends BaseEndpointBuilder {
  withPathParams<X extends PathParams>(): GetBufferEndpointBuilder<X> {
    // what: Cast to unknown first since TS doesn't like us changing a generic.
    // why: This is safe because we don't actually "use" the generic until "build".
    return this as unknown as GetBufferEndpointBuilder<X>;
  }

  build(): GetBufferEndpoint<TPathParams> {
    // what: Pull variables out of `this` so they are owned by createRequest closure
    const { path } = this;

    return {
      createRequest(params: TPathParams) {
        return {
          type: 'rest-buffer',
          method: 'GET',
          path: resolvePathParams(path, params),
        };
      },
    };
  }
}

// region: builder classes (GET) ---------------------------------------

class GetEndpointBuilder<
  TReturnType = DefaultReturnType,
  TPathParams extends PathParams = DefaultPathParams,
> extends BaseEndpointBuilder {
  withReturnType<X>(): GetEndpointBuilder<X, TPathParams> {
    return this;
  }

  withBufferReturnType(): GetBufferEndpointBuilder<TPathParams> {
    return new GetBufferEndpointBuilder<TPathParams>(this.path);
  }

  withPathParams<X extends PathParams>(): GetEndpointBuilder<TReturnType, X> {
    // what: Cast to unknown first since TS doesn't like us changing a generic.
    // why: This is safe because we don't actually "use" the generic until "build".
    return this as unknown as GetEndpointBuilder<TReturnType, X>;
  }

  build(): GetEndpoint<TReturnType, TPathParams> {
    // what: Pull variables out of `this` so they are owned by createRequest closure
    const { path } = this;

    return {
      createRequest(params: TPathParams) {
        return {
          type: 'rest',
          method: 'GET',
          path: resolvePathParams(path, params),
        };
      },
    };
  }
}

// region: export ------------------------------------------------------

export function declareEndpoint(method: 'POST', path: string): PostEndpointBuilder;
export function declareEndpoint(method: 'GET', path: string): GetEndpointBuilder;
export function declareEndpoint(method: 'DELETE', path: string): DeleteEndpointBuilder;
export function declareEndpoint(
  method: EndpointMethod,
  path: string,
): PostEndpointBuilder | GetEndpointBuilder | DeleteEndpointBuilder {
  if (method === 'GET') {
    return new GetEndpointBuilder(path);
  }

  if (method === 'POST') {
    return new PostEndpointBuilder(path);
  }

  if (method === 'DELETE') {
    return new DeleteEndpointBuilder(path);
  }
  throw new Error(`Unexpected method found! ${method}`);
}
