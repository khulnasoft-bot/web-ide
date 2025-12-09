import { WEB_IDE_EXTENSION_ID } from '@khulnasoft/web-ide-interop';
import * as vsCodePackageConfig from './vscode.package.json';

describe('vscode.package.json', () => {
  it('extension ID matches WEB_IDE_EXTENSION_ID', () => {
    const extensionId = `${vsCodePackageConfig.publisher}.${vsCodePackageConfig.name}`;
    expect(extensionId).toEqual(WEB_IDE_EXTENSION_ID);
  });
});
