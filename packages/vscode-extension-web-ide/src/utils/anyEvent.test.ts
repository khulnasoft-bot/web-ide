import type { Event, Disposable } from 'vscode';
import { EventEmitter } from 'vscode';
import { anyEvent } from './anyEvent';

const TEST_THIS_ARG = {};
const TEST_EVENT_ARG = 'test-foo-destroyed';

describe('utils/anyEvent', () => {
  const testEventEmitters: EventEmitter<string>[] = [
    new EventEmitter(),
    new EventEmitter(),
    new EventEmitter(),
  ];
  const testListener = jest.fn<unknown, [string]>();

  let subject: Event<string>;

  beforeEach(() => {
    subject = anyEvent(...testEventEmitters.map(x => x.event));
  });

  describe('when anyEvent is listened to', () => {
    let disposables: Disposable[];
    let subjectDisposable: Disposable;

    beforeEach(() => {
      disposables = [];

      subjectDisposable = subject(testListener, TEST_THIS_ARG, disposables);
    });

    afterEach(() => {
      subjectDisposable.dispose();
    });

    it('does not call listener', () => {
      expect(testListener).not.toHaveBeenCalled();
    });

    it.each(testEventEmitters)('when event (%#) is emitted, listener is triggered', emitter => {
      emitter.fire(TEST_EVENT_ARG);

      expect(testListener).toHaveBeenCalledTimes(1);
      expect(testListener).toHaveBeenCalledWith(TEST_EVENT_ARG);
    });

    describe('when disposed', () => {
      beforeEach(() => {
        subjectDisposable.dispose();
      });

      it.each(testEventEmitters)('when event (%#) is emitted, nothing happens', emitter => {
        emitter.fire(TEST_EVENT_ARG);

        expect(testListener).toHaveBeenCalledTimes(0);
      });
    });
  });
});
