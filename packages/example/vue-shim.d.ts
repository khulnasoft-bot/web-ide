declare module '*.vue' {
  import type { ComputedOptions, MethodOptions } from 'vue';
  import { Component } from 'vue';

  export default Component<unknown, unknown, unknown, ComputedOptions, MethodOptions>();
}
