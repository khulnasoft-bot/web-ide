import * as vscode from 'vscode';
import type { FileStatus } from '@gitlab/web-ide-fs';
import { FileStatusType } from '@gitlab/web-ide-fs';
import { createStatusViewModel, toResourceState, toFileDecoration } from './status';
import type { StatusViewModel } from './types';
import { FS_SCHEME, SCM_SCHEME } from '../constants';

const TEST_REPO_ROOT = '/test-repo-root';
const TEST_CONTENT = '# Hello World\n\nNew file here!\n';

const TEST_STATUS = {
  path: '/docs/README.md',
  content: Buffer.from(TEST_CONTENT),
};
const TEST_FS_URI = vscode.Uri.from({
  scheme: FS_SCHEME,
  path: `${TEST_REPO_ROOT}/docs/README.md`,
});
const TEST_SCM_URI = vscode.Uri.from({
  scheme: SCM_SCHEME,
  path: `${TEST_REPO_ROOT}/docs/README.md`,
});
const TEST_SCM_URI_HEAD = TEST_SCM_URI.with({
  query: JSON.stringify({ path: `${TEST_REPO_ROOT}/docs/README.md`, ref: 'HEAD' }),
});

describe('scm/status', () => {
  describe('createStatusViewModel', () => {
    it.each<[string, FileStatus, StatusViewModel]>([
      [
        'for Modified status',
        {
          type: FileStatusType.Modified,
          ...TEST_STATUS,
        },
        {
          uri: TEST_SCM_URI,
          command: {
            command: 'vscode.diff',
            title: 'Open',
            arguments: [TEST_SCM_URI_HEAD, TEST_FS_URI, 'README.md (Changed)'],
          },
          decorations: {
            color: new vscode.ThemeColor('webIde.modifiedResourceForeground'),
            letter: 'M',
            propagate: true,
            strikethrough: false,
            tooltip: 'Modified',
          },
        },
      ],
      [
        'for Created status',
        {
          type: FileStatusType.Created,
          ...TEST_STATUS,
        },
        {
          uri: TEST_SCM_URI,
          command: {
            command: 'vscode.open',
            title: 'Open',
            arguments: [TEST_FS_URI, {}, 'README.md (Changed)'],
          },
          decorations: {
            color: new vscode.ThemeColor('webIde.addedResourceForeground'),
            letter: 'A',
            propagate: true,
            strikethrough: false,
            tooltip: 'Created',
          },
        },
      ],
      [
        'for Deleted status',
        {
          type: FileStatusType.Deleted,
          path: '/docs/README.md',
        },
        {
          uri: TEST_SCM_URI,
          command: {
            command: 'vscode.open',
            title: 'Open',
            arguments: [TEST_SCM_URI_HEAD, {}, 'README.md (Deleted)'],
          },
          decorations: {
            color: new vscode.ThemeColor('webIde.deletedResourceForeground'),
            letter: 'D',
            propagate: false,
            strikethrough: true,
            tooltip: 'Deleted',
          },
        },
      ],
    ])('%s, returns friendly view model', (_, status, expected) => {
      expect(createStatusViewModel(status, TEST_REPO_ROOT)).toEqual(expected);
    });
  });

  describe('toResourceState', () => {
    it('maps firendly view model into vscode ResourceState', () => {
      const vm = createStatusViewModel(
        { type: FileStatusType.Created, ...TEST_STATUS },
        TEST_REPO_ROOT,
      );

      expect(toResourceState(vm)).toEqual({
        resourceUri: vm.uri,
        command: vm.command,
        decorations: {
          faded: false,
          strikeThrough: vm.decorations.strikethrough,
          tooltip: vm.decorations.tooltip,
        },
      });
    });
  });

  describe('toFileDecoration', () => {
    it('maps firendly view model into vscode FileDecoration', () => {
      const vm = createStatusViewModel(
        { type: FileStatusType.Created, ...TEST_STATUS },
        TEST_REPO_ROOT,
      );

      expect(toFileDecoration(vm)).toEqual({
        color: vm.decorations.color,
        letter: vm.decorations.letter,
        tooltip: vm.decorations.tooltip,
        propagate: vm.decorations.propagate,
      });
    });
  });
});
