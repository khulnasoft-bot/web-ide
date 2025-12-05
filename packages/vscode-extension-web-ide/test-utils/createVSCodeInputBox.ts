import * as vscode from 'vscode';

export const createVSCodeInputBox = (): jest.Mocked<vscode.InputBox> => ({
  busy: false,
  buttons: [],
  dispose: jest.fn(),
  enabled: false,
  hide: jest.fn(),
  ignoreFocusOut: false,
  onDidAccept: jest.fn(),
  onDidChangeValue: jest.fn(),
  onDidHide: jest.fn(),
  onDidTriggerButton: jest.fn(),
  password: false,
  placeholder: undefined,
  prompt: undefined,
  show: jest.fn(),
  step: undefined,
  title: undefined,
  totalSteps: undefined,
  validationMessage: undefined,
  value: '',
  valueSelection: undefined,
});
