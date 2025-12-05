import * as vscode from 'vscode';
import { showConfirmForcePush } from './showConfirmForcePush';

describe('scm/commit/showConfirmForcePush', () => {
  it('should return true without prompt when no force or amend', async () => {
    const result = await showConfirmForcePush({ force: false, amend: false });
    expect(result).toBe(true);
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  describe('when user confirms', () => {
    beforeEach(() => {
      jest
        .mocked(vscode.window.showWarningMessage)
        .mockResolvedValue('Permanently Overwrite' as unknown as vscode.MessageItem);
    });

    it('should show force push warning when force is true with existing commits', async () => {
      const result = await showConfirmForcePush({ force: true, amend: false, existingCommits: 3 });

      expect(result).toBe(true);
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'This action will permanently delete 3 commits in the remote branch. Are you sure?',
        {
          modal: true,
          detail: 'The deleted commits may not belong to you, and can never be recovered.',
        },
        'Permanently Overwrite',
      );
    });

    it('should show amend warning when amend is true without existing commits', async () => {
      const result = await showConfirmForcePush({ force: false, amend: true });

      expect(result).toBe(true);
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'This action will permanently overwrite the latest commit. Are you sure?',
        {
          modal: true,
          detail: 'The deleted commit may not belong to you, and can never be recovered.',
        },
        'Permanently Overwrite',
      );
    });

    it('should show amend warning when amend is true with existing commits', async () => {
      const result = await showConfirmForcePush({ force: false, amend: true, existingCommits: 2 });

      expect(result).toBe(true);
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'This action will permanently delete 2 commits and overwrite the latest commit. Are you sure?',
        {
          modal: true,
          detail: 'The deleted commits may not belong to you, and can never be recovered.',
        },
        'Permanently Overwrite',
      );
    });

    it('should return true when force is true but no existing commits', async () => {
      const result = await showConfirmForcePush({ force: true, amend: false });

      expect(result).toBe(true);
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });
  });

  describe('when user cancels', () => {
    beforeEach(() => {
      jest.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);
    });

    it('should return false when user does not confirm force push', async () => {
      const result = await showConfirmForcePush({ force: true, amend: false, existingCommits: 2 });

      expect(result).toBe(false);
    });

    it('should return false when user does not confirm amend', async () => {
      const result = await showConfirmForcePush({ force: false, amend: true });

      expect(result).toBe(false);
    });
  });
});
