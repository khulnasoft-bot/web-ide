import type { ResponseErrorBody } from '@gitlab/vscode-mediator-commands';

function isResponseErrorBody(obj: unknown): obj is ResponseErrorBody {
  const responseErrorBody = obj as ResponseErrorBody;

  if (!obj) {
    return false;
  }

  return typeof responseErrorBody.status === 'number';
}

export const parseResponseErrorMessage = ({ message }: Error): ResponseErrorBody | string => {
  try {
    const body = JSON.parse(message);

    return isResponseErrorBody(body) ? body : message;
  } catch {
    return message;
  }
};
