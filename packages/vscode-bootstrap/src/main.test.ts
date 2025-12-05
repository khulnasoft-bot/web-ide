import type { WebIDEConfigResponseMessage } from '@gitlab/cross-origin-channel';
import { createConfig, createFakePartial } from '@gitlab/utils-test';
import { DefaultCrossWindowChannel } from '@gitlab/cross-origin-channel';
import { ErrorType, type WebIdeConfig } from '@gitlab/web-ide-types';
import { handleEmbedderChange } from './handleEmbedderChange';
import { main } from './main';
import { start } from './start';

jest.mock('@gitlab/cross-origin-channel');
jest.mock('./handleEmbedderChange');
jest.mock('./amd/configRequire');
jest.mock('./utils/insertScript');
jest.mock('./utils/insertMeta');
jest.mock('./utils/getRepoRoot');
jest.mock('./utils/loadGitLabFonts');
jest.mock('./start');

describe('main.ts', () => {
  const mockHandleEmbedderChange = jest.mocked(handleEmbedderChange);
  const mockDefaultCrossWindowChannel = jest.mocked(DefaultCrossWindowChannel);
  let mockChannel: DefaultCrossWindowChannel;
  let mockConfigMessage: WebIDEConfigResponseMessage;
  let config: WebIdeConfig;
  let originalFetch: Window['fetch'];

  beforeEach(() => {
    jest.clearAllMocks();

    originalFetch = window.fetch;
    window.fetch = jest.fn().mockResolvedValue({
      text: () => '{}',
    });
    mockChannel = createFakePartial<DefaultCrossWindowChannel>({
      postMessage: jest.fn(),
      waitForMessage: jest.fn(),
    });
    config = createConfig();
    mockConfigMessage = createFakePartial<WebIDEConfigResponseMessage>({
      params: {
        config: JSON.stringify(config),
      },
    });

    mockDefaultCrossWindowChannel.mockImplementation(() => mockChannel);

    jest.mocked(mockChannel.waitForMessage).mockResolvedValue(mockConfigMessage);

    mockHandleEmbedderChange.mockResolvedValue(mockConfigMessage);
  });

  beforeEach(async () => {
    await main();
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('requires web ide config', () => {
    expect(mockChannel.postMessage).toHaveBeenCalledWith({ key: 'web-ide-config-request' });
  });

  it('sends an POST request to the /api/graphql endpoint', () => {
    expect(fetch).toHaveBeenCalledWith(`${config.gitlabUrl}/api/graphql`, {
      method: 'POST',
      mode: 'cors',
    });
  });

  it('sends web-ide-cors-success-response message', () => {
    expect(mockChannel.postMessage).toHaveBeenCalledWith({ key: 'web-ide-cors-success-response' });
  });

  it('invokes handleEmbedderChange function', async () => {
    expect(mockHandleEmbedderChange).toHaveBeenCalledTimes(1);
    expect(mockHandleEmbedderChange).toHaveBeenCalledWith(mockConfigMessage);
  });

  it('sends "ready" message', () => {
    expect(mockChannel.postMessage).toHaveBeenLastCalledWith({ key: 'ready' });
  });

  describe.each([() => start, () => window.fetch])('when an error occurs', mockFn => {
    const error = new Error('Could not create workbench');

    beforeEach(() => {
      jest.mocked(mockFn()).mockImplementationOnce(() => {
        throw error;
      });
    });

    it('posts an error message to the window channel', async () => {
      await main();

      expect(mockChannel.postMessage).toHaveBeenLastCalledWith({
        key: 'error',
        params: { errorType: ErrorType.START_WORKBENCH_FAILED, details: error.message },
      });
    });
  });
});
