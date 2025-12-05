import * as vscode from 'vscode';
import { setHref } from '../mediator';
import {
  MSG_CANNOT_PUSH_CODE_SHOULD_FORK,
  MSG_CANNOT_PUSH_CODE_GO_TO_FORK,
  MSG_CANNOT_PUSH_CODE,
  MSG_FORK,
  MSG_GO_TO_FORK,
  MSG_TITLE,
  showCannotPushCodeWarning,
} from './showCannotPushCodeWarning';

jest.mock('../mediator');

describe('ui/showCannotPushCodeWarning', () => {
  describe.each`
    forkInfo                       | selection         | expectDetail                        | expectActions       | expectHrefCalls
    ${undefined}                   | ${undefined}      | ${MSG_CANNOT_PUSH_CODE}             | ${[]}               | ${[]}
    ${{ ide_path: '/ide/path' }}   | ${undefined}      | ${MSG_CANNOT_PUSH_CODE_GO_TO_FORK}  | ${[MSG_GO_TO_FORK]} | ${[]}
    ${{ ide_path: '/ide/path' }}   | ${MSG_GO_TO_FORK} | ${MSG_CANNOT_PUSH_CODE_GO_TO_FORK}  | ${[MSG_GO_TO_FORK]} | ${[['/ide/path']]}
    ${{ fork_path: '/fork/path' }} | ${undefined}      | ${MSG_CANNOT_PUSH_CODE_SHOULD_FORK} | ${[MSG_FORK]}       | ${[]}
    ${{ fork_path: '/fork/path' }} | ${MSG_FORK}       | ${MSG_CANNOT_PUSH_CODE_SHOULD_FORK} | ${[MSG_FORK]}       | ${[['/fork/path']]}
  `(
    'with forkInfo=$forkInfo and selection=$selection',
    ({ forkInfo, selection, expectDetail, expectActions, expectHrefCalls }) => {
      beforeEach(async () => {
        jest.mocked(vscode.window.showWarningMessage).mockResolvedValue(selection);
        await showCannotPushCodeWarning(forkInfo);
      });

      it('shows warning message', () => {
        expect(vscode.window.showWarningMessage).toHaveBeenCalledTimes(1);
        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
          MSG_TITLE,
          { modal: true, detail: expectDetail },
          ...expectActions,
        );
      });

      it(`sets href = ${expectHrefCalls}`, () => {
        expect(jest.mocked(setHref).mock.calls).toEqual(expectHrefCalls);
      });
    },
  );
});
