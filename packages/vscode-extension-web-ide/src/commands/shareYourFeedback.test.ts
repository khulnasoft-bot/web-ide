import * as vscode from 'vscode';
import { FEEDBACK_ISSUE_URL } from '../constants';
import shareYourFeedback from './shareYourFeedback';

describe('commands/shareYourFeedback', () => {
  it('opens web ide feedback URL issue in an external window', async () => {
    await shareYourFeedback();

    expect(vscode.env.openExternal).toHaveBeenCalledWith(vscode.Uri.parse(FEEDBACK_ISSUE_URL));
  });
});
