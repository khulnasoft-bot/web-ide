import * as vscode from 'vscode';
import { FEEDBACK_ISSUE_URL } from '../constants';

export default () => vscode.env.openExternal(vscode.Uri.parse(FEEDBACK_ISSUE_URL));
