import type * as vscode from 'vscode';
import { LogLevel } from '@gitlab/logger';
import { OutputChannelLogWriter } from './OutputChannelLogWriter';
import { createFakePartial } from '../../test-utils/createFakePartial';

describe('vscode/OutputChannelLogWriter', () => {
  let outputChannel: vscode.OutputChannel;
  let subject: OutputChannelLogWriter;

  beforeEach(() => {
    outputChannel = createFakePartial<vscode.OutputChannel>({
      appendLine: jest.fn(),
    });
    subject = new OutputChannelLogWriter(outputChannel);
  });

  describe('log', () => {
    it('appends a line to the output channel', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-02-01T07:01Z'));

      subject.log(LogLevel.Debug, 'hello', 'world\n\nHow are you?');

      jest.setSystemTime(new Date('2023-02-01T08:01Z'));

      subject.log(LogLevel.Error, 'goodbye!');

      expect(jest.mocked(outputChannel.appendLine).mock.calls).toEqual([
        ['2023-02-01T07:01:00.000Z [debug] helloworld\n    \n    How are you?'],
        ['2023-02-01T08:01:00.000Z [error] goodbye!'],
      ]);
    });
  });
});
