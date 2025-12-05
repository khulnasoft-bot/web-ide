import { FetchError } from './types';

async function getResponseBody(response: Response): Promise<unknown> {
  try {
    if (response.headers.get('Content-Type') === 'application/json') {
      return await response.json();
    }

    // note: Let's just return a text representation of the response as a sensible default
    return await response.text();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to parse response body of ${response.url}`, e);

    return '';
  }
}

export async function createResponseError(response: Response) {
  const body = await getResponseBody(response);

  return new FetchError(response, body);
}
