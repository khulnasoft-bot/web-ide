import { joinPaths } from '@khulnasoft/utils-path';
import * as vscode from 'vscode';
import { FS_SCHEME } from '../constants';
import { getConfig } from '../mediator';
import { log } from '../utils/log';

export const EXTENSION_ID = 'redhat.vscode-yaml';
export const RECOGNIZED_SCHEMES = [
  FS_SCHEME, // Web IDE scheme
  'file', // the default local file scheme
  'schemaservice', // comes from VSCode's JSON language server when there are multiple JSON schemas identified
];

// source: https://github.com/redhat-developer/vscode-yaml/blob/main/src/schema-extension-api.ts#L48
export interface VscodeYamlExtensionApi {
  registerContributor?: (
    schema: string,
    requestSchema: (resource: string) => string,
    requestSchemaContent: (uri: string) => Promise<string>,
    label?: string,
  ) => boolean;
}

function requestSchema(): string {
  return '';
}

async function getWebIdeCompatibleUri(uriStr: string): Promise<vscode.Uri> {
  const uriArg = vscode.Uri.parse(uriStr);

  if (!RECOGNIZED_SCHEMES.includes(uriArg.scheme)) {
    log.error(`Unrecognized scheme ${uriArg.scheme}`);
    throw Error(`Unrecognized scheme ${uriArg.scheme}`);
  }

  const { repoRoot } = await getConfig();

  // Somehow, when a remote schema is present the `uriStr` passed is translated to `khulnasoft-web-ide:/~/path/to/file.json`
  // This leads to incorrect parsing of the Uri (`~` is included as a path) causing it to fail when attempting to read the file.
  // Let's remove this `~` if it exists and is in the beginning of the path.
  const pathNoTilde = uriArg.path.replace(/^\/~/, '');

  return vscode.Uri.from({
    scheme: FS_SCHEME,
    path: joinPaths('/', repoRoot, pathNoTilde),
  });
}

export async function requestSchemaContent(uriStr: string): Promise<string> {
  const uri = await getWebIdeCompatibleUri(uriStr);

  let content: Uint8Array;
  try {
    content = await vscode.workspace.fs.readFile(uri);
  } catch (e) {
    log.error(`Error reading YAML schema for ${uriStr}`, e);
    await vscode.window.showErrorMessage(`Cannot read YAML schema: ${uriStr}`);
    return '';
  }

  const decoder = new TextDecoder('utf-8');
  const result = decoder.decode(content);
  return result;
}

export async function setup(extension?: vscode.Extension<VscodeYamlExtensionApi>) {
  const api = await extension?.activate();

  if (!api) {
    return;
  }

  if (!api.registerContributor) {
    log.info(
      'Attempt to register schema in vscode-yaml extension failed. registerContributor method is not defined',
    );
    return;
  }

  for (const scheme of RECOGNIZED_SCHEMES) {
    api.registerContributor(scheme, requestSchema, requestSchemaContent);
  }
}
