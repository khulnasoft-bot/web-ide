import { readFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import { join } from 'path';

describe('workbench.html', () => {
  const WORKBENCH_WINDOW_ORIGIN = 'https://example.com';

  let workbenchWindow: Window;

  const createWorkbenchWindow = async (): Promise<Window> => {
    const workbenchHtml = await readFile(join(__dirname, '../assets/workbench.html'), 'utf-8');

    return new JSDOM(workbenchHtml, { url: WORKBENCH_WINDOW_ORIGIN }).window as unknown as Window;
  };

  beforeEach(async () => {
    workbenchWindow = await createWorkbenchWindow();
  });

  it('loads vscode-bootstrap module', async () => {
    const script = workbenchWindow.document.querySelector('script');

    expect(script?.getAttribute('type')).toBe('module');
    expect(script?.innerHTML.trim()).toMatchSnapshot();
  });

  it('loads vscode CSS', async () => {
    const link = workbenchWindow.document.querySelector('link');

    expect(link?.getAttribute('href')).toBe(`../vscode/out/vs/workbench/workbench.web.main.css`);
  });

  it('adds http-equiv meta with CSP policy', () => {
    const meta = workbenchWindow.document.querySelector('meta[http-equiv]');

    expect(meta?.getAttribute('content')).toBe(
      "script-src 'self' 'sha256-C5NYHanFzD/3S/E+C9Ga8zzHxTUaR7hyCqrbSjck17w=' 'wasm-unsafe-eval'; worker-src blob:",
    );
  });
});
