// TODO: For some reason `ts-jest` isn't finding the `.d.ts` files
import '../../vscode.proposed.codiconDecoration.d';

import * as vscode from 'vscode';
import {
  FILE_DECORATION,
  MergeRequestFileDecorationProvider,
} from './MergeRequestFileDecorationProvider';
import { FS_SCHEME } from '../constants';

const TEST_MR_CHANGES = ['/gitlab-ui/README.md', '/gitlab-ui/src', '/gitlab-ui/src/foo.js'];

describe('vscode/MergeRequestFileDecorationProvider', () => {
  let subject: MergeRequestFileDecorationProvider;

  beforeEach(() => {
    subject = new MergeRequestFileDecorationProvider(new Set(TEST_MR_CHANGES));
  });

  it.each`
    uri                                           | decoration
    ${`${FS_SCHEME}:///gitlab-ui/README.md`}      | ${FILE_DECORATION}
    ${`some-other-scheme:///gitlab-ui/README.md`} | ${undefined}
    ${`${FS_SCHEME}:///gitlab-ui/src`}            | ${FILE_DECORATION}
    ${`${FS_SCHEME}:///gitlab-ui/doc`}            | ${undefined}
  `('with "$uri", provides decoration "$decoration"', async ({ uri, decoration }) => {
    const result = await subject.provideFileDecoration(vscode.Uri.parse(uri));

    expect(result).toEqual(decoration);
  });
});
