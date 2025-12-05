import * as vscode from 'vscode';
import type { InputResponse } from './types';

// https://code.visualstudio.com/api/references/vscode-api#InputBox
interface VSCodeFacadeInputBox {
  ignoreFocusOut?: boolean;
  password?: boolean;
  placeholder?: string;
  prompt?: string;
  step?: number;
  title?: string;
  totalSteps?: number;
  onSubmit?: (val: string) => Promise<string | vscode.InputBoxValidationMessage | undefined>;
  initialValue?: string;
}

export const showInputBox = (options: VSCodeFacadeInputBox): Promise<InputResponse<string>> =>
  new Promise(resolve => {
    const input = vscode.window.createInputBox();
    input.value = options.initialValue || '';
    input.ignoreFocusOut = options.ignoreFocusOut || false;
    input.password = options.password || false;
    input.placeholder = options.placeholder;
    input.prompt = options.prompt;
    input.step = options.step;
    input.title = options.title;
    input.totalSteps = options.totalSteps;

    input.onDidAccept(async () => {
      const { value } = input;
      input.enabled = false;
      input.busy = true;
      const validationMessage = options.onSubmit ? await options.onSubmit(value) : undefined;
      if (validationMessage) {
        input.validationMessage = validationMessage;
      } else {
        resolve({ canceled: false, value });
      }
      input.enabled = true;
      input.busy = false;
    });

    input.onDidHide(async () => {
      resolve({ canceled: true });
    });

    input.show();
  });
