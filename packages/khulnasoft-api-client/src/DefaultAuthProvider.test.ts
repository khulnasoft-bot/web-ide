import { DefaultAuthProvider } from './DefaultAuthProvider';

const TEST_TOKEN = '123ABC';

describe('DefaultAuthProvider', () => {
  let subject: DefaultAuthProvider;

  beforeEach(() => {
    subject = new DefaultAuthProvider(TEST_TOKEN);
  });

  it('getToken - returns expected token', async () => {
    const actual = await subject.getToken();

    expect(actual).toEqual(TEST_TOKEN);
  });
});
