import type { GraphQLRequest } from '@gitlab/web-ide-interop';

/**
 * Helps create a GraphQLRequest that co-locates the:
 *
 * - Result type
 * - Variables type
 *
 * @returns a GraphQLRequest<TResult>
 */
export const createGraphQLRequest = <TResult, TVariables>(
  query: string,
  variables: TVariables,
): GraphQLRequest<TResult> => ({
  type: 'graphql',
  query,
  // We recieve a *specific* type for `variables`, but we have to transform
  // it to the expected generic type.
  variables: variables as unknown as Record<string, unknown>,
});
