import type * as vscode from 'vscode';
import { createFakePartial } from '@khulnasoft/utils-test';
import {
  MESSAGE_OPEN_URI,
  MESSAGE_PREVENT_UNLOAD,
  MESSAGE_SET_HREF,
  MESSAGE_UPDATE_WEB_IDE_CONTEXT,
} from '@khulnasoft/vscode-mediator-commands';
import { getExtensionContext } from '../context';
import { openUri, preventUnload, setHref, updateWebIdeContext } from './messages';

jest.mock('../context');

describe('vscode-extension-web-ide/mediator/messages', () => {
  let postMessageSpy: jest.Mock<void, unknown[]>;

  beforeEach(() => {
    postMessageSpy = jest.fn();

    jest.mocked(getExtensionContext).mockReturnValue(
      createFakePartial<vscode.ExtensionContext>({
        messagePassingProtocol: createFakePartial<vscode.MessagePassingProtocol>({
          postMessage: postMessageSpy,
        }),
      }),
    );
  });

  describe.each`
    desc                     | act                                                                     | expected
    ${'openUri'}             | ${() => openUri({ key: 'signIn' })}                                     | ${{ key: MESSAGE_OPEN_URI, params: [{ key: 'signIn' }] }}
    ${'preventUnload'}       | ${() => preventUnload({ shouldPrevent: false })}                        | ${{ key: MESSAGE_PREVENT_UNLOAD, params: [{ shouldPrevent: false }] }}
    ${'setHref'}             | ${() => setHref('https://google.com')}                                  | ${{ key: MESSAGE_SET_HREF, params: ['https://google.com'] }}
    ${'updateWebIdeContext'} | ${() => updateWebIdeContext({ ref: 'test', projectPath: 'test-path' })} | ${{ key: MESSAGE_UPDATE_WEB_IDE_CONTEXT, params: [{ ref: 'test', projectPath: 'test-path' }] }}
  `('$desc', ({ act, expected }) => {
    beforeEach(() => {
      act();
    });

    it('calls postMessage with event', () => {
      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(expected);
    });
  });
});
