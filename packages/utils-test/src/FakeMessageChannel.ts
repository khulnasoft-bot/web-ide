/* eslint-disable max-classes-per-file, class-methods-use-this */
class FakeMessagePort extends EventTarget implements MessagePort {
  #messageChannel: MessageChannel;

  #otherPortName: 'port1' | 'port2';

  constructor(messageChannel: MessageChannel, otherPortName: 'port1' | 'port2') {
    super();

    this.onmessage = () => {};
    this.onmessageerror = () => {};
    this.#messageChannel = messageChannel;
    this.#otherPortName = otherPortName;
  }

  onmessage: (event: MessageEvent) => void;

  onmessageerror: (event: MessageEvent) => void;

  postMessage(data: unknown) {
    const otherPort = this.#messageChannel[this.#otherPortName];

    otherPort.dispatchEvent(new MessageEvent('message', { data }));
  }

  start() {}

  close() {}
}

export class FakeMessageChannel implements MessageChannel {
  #port1: FakeMessagePort;

  #port2: FakeMessagePort;

  constructor() {
    this.#port1 = new FakeMessagePort(this, 'port2');
    this.#port2 = new FakeMessagePort(this, 'port1');
  }

  get port1() {
    return this.#port1;
  }

  get port2() {
    return this.#port2;
  }
}
