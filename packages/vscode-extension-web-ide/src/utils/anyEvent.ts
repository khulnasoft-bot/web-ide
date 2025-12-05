import type { Event } from 'vscode';
import { Disposable } from 'vscode';

// Lovingly borrowed from https://sourcegraph.com/github.com/microsoft/vscode@3bdea7784d6ef67722967a4cd51179b30e9a1013/-/blob/extensions/git/src/util.ts?L50
export function anyEvent<T>(...events: Event<T>[]): Event<T> {
  return (listener: (e: T) => unknown, thisArgs?: unknown, disposables?: Disposable[]) => {
    const listenedEvents = events.map(event =>
      event(eventArg => listener.call(thisArgs, eventArg)),
    );
    const result = Disposable.from(...listenedEvents);

    disposables?.push(result);

    return result;
  };
}
