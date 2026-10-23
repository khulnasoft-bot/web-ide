// TODO: For some reason `ts-jest` isn't finsing the `.d.ts` files
import '../../vscode.proposed.scmActionButton.d';
import '../../vscode.proposed.scmValidation.d';

import * as vscode from 'vscode';
import type { FileStatus } from '@gitlab/web-ide-fs';
import { FileStatusType } from '@gitlab/web-ide-fs';
import { createConfig } from '@gitlab/utils-test';
import type { WebIdeConfig } from '@gitlab/web-ide-types';
import { TEST_PROJECT, TEST_REF_BRANCH } from '../../test-utils';
import { createSourceControlViewModel } from './create';
import type { SourceControlViewModel, StatusViewModel } from './types';
import {
  COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
  COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_TEXT,
  COMMIT_AND_FORCE_PUSH_COMMAND_ID,
  COMMIT_AND_FORCE_PUSH_COMMAND_TEXT,
  COMMIT_COMMAND_ID,
  COMMIT_COMMAND_TEXT,
  SECONDARY_COMMIT_COMMAND_TEXT,
  SOURCE_CONTROL_CHANGES_ID,
  SOURCE_CONTROL_CHANGES_NAME,
  SOURCE_CONTROL_ID,
  SOURCE_CONTROL_NAME,
} from '../constants';
import { ResourceDecorationProvider } from './ResourceDecorationProvider';
import { createStatusViewModel, toResourceState } from './status';

jest.mock('./ResourceDecorationProvider');

const TEST_REPO_ROOT = '/test-repo-root';
const TEST_NEW_COMMIT_MESSAGE = 'New commit message from a test!';
const TEST_NEW_STATUS: FileStatus[] = [{ type: FileStatusType.Deleted, path: '/README.md' }];
const TEST_CONFIG: WebIdeConfig = {
  ...createConfig(),
  featureFlags: {
    additionalSourceControlOperations: false,
  },
};
const expectedSecondaryCommands = [
  {
    title: COMMIT_AND_FORCE_PUSH_COMMAND_TEXT,
    command: COMMIT_AND_FORCE_PUSH_COMMAND_ID,
    index: 1,
  },
  {
    title: COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_TEXT,
    command: COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
    index: 2,
  },
];
describe('scm/create', () => {
  let disposables: vscode.Disposable[];
  let subject: SourceControlViewModel;
  let sourceControl: vscode.SourceControl;
  let changesGroup: vscode.SourceControlResourceGroup;
  let decorationProvider: vscode.FileDecorationProvider;

  const getResourceDecorationProviderInstance = () =>
    jest.mocked(ResourceDecorationProvider).mock.instances[0];

  const createMockChangesGroup = (id: string): vscode.SourceControlResourceGroup => ({
    id,
    label: '',
    resourceStates: [],
    hideWhenEmpty: false,
    dispose: jest.fn(),
  });

  const createMockSourceControl = (id: string): vscode.SourceControl => ({
    id,
    createResourceGroup: jest.fn().mockImplementation((resourceGroupId: string) => {
      changesGroup = createMockChangesGroup(resourceGroupId);

      return changesGroup;
    }),
    dispose: jest.fn(),
    inputBox: {
      enabled: true,
      placeholder: '',
      value: '',
      visible: true,
      showValidationMessage: jest.fn(),
    },
    label: '',
    rootUri: undefined,
  });

  beforeEach(() => {
    disposables = [];
    decorationProvider = {
      provideFileDecoration: jest.fn(),
    };

    jest.mocked(vscode.scm.createSourceControl).mockImplementation((id: string) => {
      sourceControl = createMockSourceControl(id);

      return sourceControl;
    });
    jest
      .mocked(ResourceDecorationProvider.prototype.createVSCodeDecorationProvider)
      .mockReturnValue(decorationProvider);
  });

  describe('with branch ref', () => {
    beforeEach(() => {
      subject = createSourceControlViewModel(
        disposables,
        TEST_REPO_ROOT,
        TEST_REF_BRANCH,
        TEST_PROJECT,
        TEST_CONFIG,
      );
    });

    it('creates sourceControl', () => {
      const commitButtonText = `${COMMIT_COMMAND_TEXT} to 'main'`;

      expect(vscode.scm.createSourceControl).toHaveBeenCalledWith(
        SOURCE_CONTROL_ID,
        SOURCE_CONTROL_NAME,
      );

      expect(sourceControl).toMatchObject({
        id: SOURCE_CONTROL_ID,
        acceptInputCommand: {
          command: COMMIT_COMMAND_ID,
          title: commitButtonText,
          arguments: [],
        },
        inputBox: {
          enabled: true,
          placeholder: 'Commit message',
        },
        actionButton: {
          description: commitButtonText,
          enabled: true,
          secondaryCommands: [
            [
              {
                title: SECONDARY_COMMIT_COMMAND_TEXT,
                command: COMMIT_COMMAND_ID,
                arguments: [
                  {
                    shouldPromptBranchName: true,
                  },
                ],
              },
            ],
          ],
          command: {
            title: commitButtonText,
            command: COMMIT_COMMAND_ID,
          },
        },
      });
    });

    describe('when project is empty', () => {
      beforeEach(() => {
        subject = createSourceControlViewModel(
          disposables,
          TEST_REPO_ROOT,
          TEST_REF_BRANCH,
          {
            ...TEST_PROJECT,
            empty_repo: true,
          },
          TEST_CONFIG,
        );
      });

      it('does not add secondary source control button', () => {
        expect(sourceControl).toMatchObject({
          actionButton: {
            enabled: true,
            secondaryCommands: undefined,
          },
        });
      });
    });

    describe('when additionalSourceControlOperations flag is true', () => {
      beforeEach(() => {
        subject = createSourceControlViewModel(
          disposables,
          TEST_REPO_ROOT,
          TEST_REF_BRANCH,
          TEST_PROJECT,
          {
            ...TEST_CONFIG,
            featureFlags: {
              additionalSourceControlOperations: true,
            },
          },
        );
      });

      it.each(expectedSecondaryCommands)(
        'adds $title secondary command at index $index',
        ({ title, command, index }) => {
          expect(sourceControl.actionButton?.secondaryCommands?.[index]).toContainEqual(
            expect.objectContaining({
              title,
              command,
            }),
          );
        },
      );
    });

    describe('when additionalSourceControlOperations flag is false', () => {
      beforeEach(() => {
        subject = createSourceControlViewModel(
          disposables,
          TEST_REPO_ROOT,
          TEST_REF_BRANCH,
          TEST_PROJECT,
          {
            ...TEST_CONFIG,
            featureFlags: {
              additionalSourceControlOperations: false,
            },
          },
        );
      });

      it.each(expectedSecondaryCommands.filter(cmd => cmd.index !== 0))(
        'does not add $title secondary command',
        ({ title, command }) => {
          expect(sourceControl.actionButton?.secondaryCommands?.flat()).not.toContainEqual(
            expect.objectContaining({
              title,
              command,
            }),
          );
        },
      );
    });

    it('creates resourceGroup', () => {
      expect(sourceControl.createResourceGroup).toHaveBeenCalledWith(
        SOURCE_CONTROL_CHANGES_ID,
        SOURCE_CONTROL_CHANGES_NAME,
      );

      expect(changesGroup).toMatchObject({
        id: SOURCE_CONTROL_CHANGES_ID,
        hideWhenEmpty: false,
        resourceStates: [],
      });
    });

    it('creates ResourceDecorationoProvider', () => {
      expect(ResourceDecorationProvider).toHaveBeenCalled();
    });

    it('register file decoration provider from ResourceDecorationProvider', () => {
      expect(vscode.window.registerFileDecorationProvider).toHaveBeenCalledWith(decorationProvider);
    });

    describe('default', () => {
      it('getStatus - returns empty status', () => {
        expect(subject.getStatus()).toEqual([]);
      });

      it('getCommitMessage - returns empty commit message', () => {
        expect(subject.getCommitMessage()).toEqual('');
      });
    });

    describe('when commit message changes', () => {
      beforeEach(() => {
        sourceControl.inputBox.value = TEST_NEW_COMMIT_MESSAGE;
      });

      it('getCommitMessage - returns new commit message', () => {
        expect(subject.getCommitMessage()).toEqual(TEST_NEW_COMMIT_MESSAGE);
      });
    });

    describe('when updated with new status', () => {
      let statusVms: StatusViewModel[];

      beforeEach(() => {
        subject.update(TEST_NEW_STATUS);
        statusVms = TEST_NEW_STATUS.map(x => createStatusViewModel(x, TEST_REPO_ROOT));
      });

      it('getStatus - returns new status', () => {
        expect(subject.getStatus()).toBe(TEST_NEW_STATUS);
      });

      it('updates the resource decoration provider', () => {
        expect(getResourceDecorationProviderInstance().update).toHaveBeenCalledWith(statusVms);
      });

      it('update changeGroup resource states', () => {
        expect(changesGroup.resourceStates).toEqual(statusVms.map(toResourceState));
      });
    });
  });

  describe('with non-branch ref', () => {
    beforeEach(() => {
      subject = createSourceControlViewModel(
        disposables,
        TEST_REPO_ROOT,
        { type: 'commit', sha: '000111' },
        TEST_PROJECT,
        TEST_CONFIG,
      );
    });

    it('creates sourceControl', () => {
      expect(sourceControl).toMatchObject({
        id: SOURCE_CONTROL_ID,
        acceptInputCommand: {
          command: COMMIT_COMMAND_ID,
          title: SECONDARY_COMMIT_COMMAND_TEXT,
          arguments: [{ shouldPromptBranchName: true }],
        },
        inputBox: {
          enabled: true,
          placeholder: 'Commit message',
        },
        actionButton: {
          description: SECONDARY_COMMIT_COMMAND_TEXT,
          enabled: true,
          secondaryCommands: undefined,
          command: {
            title: SECONDARY_COMMIT_COMMAND_TEXT,
            command: COMMIT_COMMAND_ID,
          },
        },
      });
    });
  });
});
