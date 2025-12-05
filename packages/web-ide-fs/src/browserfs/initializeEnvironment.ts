import { BFSRequire, install } from 'browserfs';
import { memoize } from 'lodash';

export const initializeEnvironment = memoize(() => {
  install({ require });
  global.Buffer = BFSRequire('buffer').Buffer;
});
