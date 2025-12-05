import * as vscode from 'vscode';
import { createVSCodeInputBox } from '../../test-utils/createVSCodeInputBox';
import { showInputBox } from './showInputBox';
import type { InputResponse } from './types';

const TEST_INVALID_MSG = 'Invalid message test';
const TEST_NEW_VALUE = 'Test new value';

describe('vscodeFacade/showInputBox', () => {
  let testOnSubmit: jest.Mock<Promise<string | undefined>, [string]>;
  let resolveOnSubmit: (value: string | undefined) => void;
  let showPromise: Promise<InputResponse<string>>;

  const getCreatedInputBox = (): jest.Mocked<vscode.InputBox> =>
    jest.mocked(vscode.window.createInputBox).mock.results[0].value;

  const triggerInputBoxEvent = (key: 'onDidHide' | 'onDidAccept') => {
    const inputBox = getCreatedInputBox();

    const [handler] = inputBox[key].mock.calls[0];

    handler();
  };

  beforeEach(() => {
    jest.mocked(vscode.window.createInputBox).mockImplementation(createVSCodeInputBox);
    testOnSubmit = jest.fn().mockResolvedValue(
      new Promise(resolve => {
        resolveOnSubmit = resolve;
      }),
    );
  });

  describe('default', () => {
    beforeEach(() => {
      showPromise = showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeholder: 'test-placeholder',
        prompt: 'test-prompt',
        step: 4,
        title: 'test-title',
        totalSteps: 7,
        onSubmit: testOnSubmit,
        initialValue: 'test-initial-value',
      });
    });

    it('sets attributes on input', () => {
      expect(getCreatedInputBox()).toMatchObject({
        value: 'test-initial-value',
        ignoreFocusOut: true,
        password: true,
        placeholder: 'test-placeholder',
        prompt: 'test-prompt',
        step: 4,
        title: 'test-title',
        totalSteps: 7,
      });
    });

    it('is shown', () => {
      expect(getCreatedInputBox().show).toHaveBeenCalled();
    });

    describe('when onDidAccept is triggered', () => {
      beforeEach(() => {
        getCreatedInputBox().value = TEST_NEW_VALUE;
        triggerInputBoxEvent('onDidAccept');
      });

      it('input becomes busy', () => {
        expect(getCreatedInputBox()).toMatchObject({
          busy: true,
          enabled: false,
        });
      });

      describe('when submission resolves with error', () => {
        beforeEach(() => {
          resolveOnSubmit(TEST_INVALID_MSG);
        });

        it('is no longer busy and shows validationMessage', () => {
          expect(getCreatedInputBox()).toMatchObject({
            validationMessage: TEST_INVALID_MSG,
            enabled: true,
            busy: false,
          });
        });
      });

      describe('when submission resolves successfully', () => {
        beforeEach(() => {
          resolveOnSubmit(undefined);
        });

        it('is no longer busy and does not show validationMessage', () => {
          expect(getCreatedInputBox()).toMatchObject({
            validationMessage: undefined,
            enabled: true,
            busy: false,
          });
        });

        it('resolves with value', async () => {
          await expect(showPromise).resolves.toEqual({ canceled: false, value: TEST_NEW_VALUE });
        });
      });
    });

    it('when onDidHide is triggered, resolves with canceled', async () => {
      triggerInputBoxEvent('onDidHide');

      await expect(showPromise).resolves.toEqual({ canceled: true });
    });
  });
});
