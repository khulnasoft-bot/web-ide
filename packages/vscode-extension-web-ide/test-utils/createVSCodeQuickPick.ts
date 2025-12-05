import * as vscode from 'vscode';

export const createVSCodeQuickPick = <T extends vscode.QuickPickItem>(): jest.Mocked<
  vscode.QuickPick<T>
> => ({
  activeItems: [],
  busy: false,
  buttons: [],
  canSelectMany: false,
  dispose: jest.fn(),
  enabled: false,
  hide: jest.fn(),
  ignoreFocusOut: false,
  items: [],
  matchOnDescription: false,
  matchOnDetail: false,
  onDidAccept: jest.fn(),
  onDidChangeActive: jest.fn(),
  onDidChangeSelection: jest.fn(),
  onDidChangeValue: jest.fn(),
  onDidHide: jest.fn(),
  onDidTriggerButton: jest.fn(),
  onDidTriggerItemButton: jest.fn(),
  placeholder: undefined,
  selectedItems: [],
  show: jest.fn(),
  step: undefined,
  title: undefined,
  totalSteps: undefined,
  value: '',
  keepScrollPosition: false,
});
