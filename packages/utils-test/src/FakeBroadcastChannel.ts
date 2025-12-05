/* eslint-disable class-methods-use-this */
export class FakeBroadcastChannel implements BroadcastChannel {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  public onmessage: ((this: BroadcastChannel, ev: MessageEvent<unknown>) => unknown) | null = null;

  public onmessageerror: ((this: BroadcastChannel, ev: MessageEvent<unknown>) => unknown) | null =
    null;

  close(): void {
    throw new Error('Method not implemented.');
  }

  postMessage(): void {
    throw new Error('Method not implemented.');
  }

  addEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  addEventListener(): void {
    throw new Error('Method not implemented.');
  }

  removeEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;

  removeEventListener(): void {
    throw new Error('Method not implemented.');
  }

  dispatchEvent(): boolean {
    throw new Error('Method not implemented.');
  }
}
