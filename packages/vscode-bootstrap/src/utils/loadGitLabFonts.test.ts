import type { WebIDEFontFace } from '@gitlab/web-ide-types';
import { loadGitLabFonts } from './loadGitLabFonts';

describe('loadGitLabFonts', () => {
  const editorFontFaces: WebIDEFontFace[] = [
    {
      family: 'GitLab Mono',
      src: [
        {
          format: 'woff2',
          url: 'http://example.com/fonts/GitLabMono.woff2',
        },
      ],
    },
    {
      family: 'GitLab Mono',
      style: 'italic',
      src: [
        {
          url: 'http://example.com/fonts/GitLabMonoItalic.woff2',
          format: 'woff2',
        },
      ],
    },
    {
      family: "A tester's font",
      src: [
        {
          format: 'opentype',
          url: 'http://example.com/fonts/FooBar.otf',
        },
      ],
      display: 'optional',
      unicodeRange: 'U+0025-00FF',
    },
    {
      family: 'Font with multiple assets',
      src: [
        {
          format: 'opentype',
          url: 'http://example.com/fonts/MultiFont1.otf',
        },
        {
          format: 'woff2',
          url: 'http://example.com/fonts/MultiFont2.woff2',
        },
      ],
    },
  ];

  it('adds a preload link for each font file', () => {
    loadGitLabFonts(editorFontFaces);

    editorFontFaces.forEach(fontFace => {
      fontFace.src.forEach(file => {
        const link = document.querySelector(`link[href="${file.url}"]`);

        expect(link?.getAttribute('rel')).toBe('preload');
        expect(link?.getAttribute('as')).toBe('font');
        expect(link?.getAttribute('type')).toBe(`font/${file.format}`);
        expect(link?.getAttribute('crossorigin')).toBe('');
      });
    });
  });

  it('adds font-face css definitions in a style tag', () => {
    expect(document.querySelector('style')?.textContent).toMatchInlineSnapshot(`
      "@font-face {
      font-family: 'GitLab Mono';
      src: url('http://example.com/fonts/GitLabMono.woff2') format('woff2');
      }
      @font-face {
      font-family: 'GitLab Mono';
      font-style: italic;
      src: url('http://example.com/fonts/GitLabMonoItalic.woff2') format('woff2');
      }
      @font-face {
      font-family: 'A tester%27s font';
      font-display: optional;
      unicode-range: U+0025-00FF;
      src: url('http://example.com/fonts/FooBar.otf') format('opentype');
      }
      @font-face {
      font-family: 'Font with multiple assets';
      src: url('http://example.com/fonts/MultiFont1.otf') format('opentype'),
        url('http://example.com/fonts/MultiFont2.woff2') format('woff2');
      }"
      `);
  });
});
