const { TestEnvironment: JSDOMEnvironment } = require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);

    this.global.dom = this.dom;
  }

  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = TextDecoder;
    }
    if (typeof this.global.structuredClone === 'undefined') {
      this.global.structuredClone = globalThis.structuredClone;
    }
  }
}

module.exports = CustomJSDOMEnvironment;
