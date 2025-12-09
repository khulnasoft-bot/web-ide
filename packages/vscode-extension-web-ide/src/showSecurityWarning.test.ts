import * as vscode from 'vscode';
import { createFakePartial } from '@khulnasoft/utils-test';
import { showSecurityWarning } from './showSecurityWarning';

describe('showSecurityWarning', () => {
  let showWarningMessageSpy: jest.SpyInstance;
  let localStorageMock: vscode.Memento;

  beforeEach(() => {
    showWarningMessageSpy = jest.mocked(vscode.window.showWarningMessage);
    localStorageMock = createFakePartial<vscode.Memento>({
      get: jest.fn(),
      update: jest.fn(),
      keys: jest.fn(),
    });
  });

  afterEach(() => {
    showWarningMessageSpy.mockRestore();
  });

  it('should show a warning message if not dismissed', async () => {
    jest.mocked(localStorageMock.get).mockReturnValue(false);
    showWarningMessageSpy.mockResolvedValue(undefined);

    await showSecurityWarning(localStorageMock);

    expect(showWarningMessageSpy).toHaveBeenCalledWith(
      'Web views and the Extension Marketplace were disabled for security reasons. The Web IDE requires HTTPs and an external extension host to isolate 3rd-party code.',
      "Don't show again",
    );
    expect(localStorageMock.update).not.toHaveBeenCalled();
  });

  it('should not show a warning message if already dismissed', async () => {
    jest.mocked(localStorageMock.get).mockReturnValue(true);

    await showSecurityWarning(localStorageMock);

    expect(showWarningMessageSpy).not.toHaveBeenCalled();
    expect(localStorageMock.update).not.toHaveBeenCalled();
  });

  it('should update localStorage if "Don\'t show again" is clicked', async () => {
    jest.mocked(localStorageMock.get).mockReturnValue(false);
    showWarningMessageSpy.mockResolvedValue("Don't show again");

    await showSecurityWarning(localStorageMock);

    expect(showWarningMessageSpy).toHaveBeenCalledTimes(1);
    expect(localStorageMock.update).toHaveBeenCalledWith('securityWarningDismissed', true);
  });

  it('should not update localStorage if warning is closed without clicking "Don\'t show again"', async () => {
    jest.mocked(localStorageMock.get).mockReturnValue(false);
    showWarningMessageSpy.mockResolvedValue(undefined);

    await showSecurityWarning(localStorageMock);

    expect(showWarningMessageSpy).toHaveBeenCalledTimes(1);
    expect(localStorageMock.update).not.toHaveBeenCalled();
  });
});
