import * as vscode from 'vscode';
import { RELOAD_COMMAND_ID } from '../constants';
import reloadWithWarning from './reloadWithWarning';

const TEST_MESSAGE = 'Hello world!';
const TEST_REF = 'main-foo-patch';
const TEST_OK_TEXT = 'Okie dokie';

describe('commands/reloadWithWarning', () => {
  let selectMessageItem: (value: vscode.MessageItem | undefined) => void;
  let result: ReturnType<typeof reloadWithWarning>;

  beforeEach(() => {
    jest.mocked(vscode.window.showWarningMessage).mockImplementation(
      () =>
        new Promise(resolve => {
          selectMessageItem = resolve;
        }),
    );

    result = reloadWithWarning({
      message: TEST_MESSAGE,
      ref: TEST_REF,
      okText: TEST_OK_TEXT,
    });
  });

  it('shows warning message', () => {
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      TEST_MESSAGE,
      { modal: true },
      TEST_OK_TEXT,
    );
  });

  describe.each`
    desc                          | selectedItem    | expectedCommandArgs
    ${'when user cancels'}        | ${undefined}    | ${undefined}
    ${'when user selects okText'} | ${TEST_OK_TEXT} | ${[RELOAD_COMMAND_ID, { ref: TEST_REF }]}
  `('$desc', ({ selectedItem, expectedCommandArgs }) => {
    beforeEach(async () => {
      selectMessageItem(selectedItem);
      await result;
    });

    if (expectedCommandArgs) {
      it('executes command', () => {
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(...expectedCommandArgs);
      });
    } else {
      it('does not execute command', () => {
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      });
    }
  });
});
