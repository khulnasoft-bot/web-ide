import { escapeCssQuotedValue } from '@gitlab/utils-escape';
import type { WebIDEFontFace } from '@gitlab/web-ide-types';
import { kebabCase } from './kebabCase';

const getFontPreloadElements = (fontFace: WebIDEFontFace) =>
  fontFace.src.map(src => {
    const linkElement = document.createElement('link');

    linkElement.setAttribute('rel', 'preload');
    linkElement.setAttribute('as', 'font');
    linkElement.setAttribute('type', `font/${src.format}`);
    linkElement.setAttribute('crossorigin', '');
    linkElement.setAttribute('href', src.url);

    return linkElement;
  });

const getFontFaceDefinition = (fontFace: WebIDEFontFace) => {
  const keys = Object.keys(fontFace) as (keyof typeof fontFace)[];

  const fontFaceBody: string[] = keys
    .filter(key => fontFace[key] && key !== 'src')
    .map(key => {
      switch (key) {
        case 'display':
        case 'family':
        case 'featureSettings':
        case 'stretch':
        case 'style':
        case 'weight': {
          const value =
            key === 'family' ? `'${escapeCssQuotedValue(fontFace[key])}'` : fontFace[key];
          // These properties of FontFace don't correspond exactly to @font-face
          // descriptors, so rename them accordingly.
          return `font-${kebabCase(key)}: ${value};`;
        }
        default:
          // Assume remaining properties don't need renaming beyond kebab-casing,
          // e.g., ascent-override.
          return `${kebabCase(key)}: ${fontFace[key]};`;
      }
    });

  const srcDeclarations = fontFace.src
    .map((src, idx) => {
      const url = escapeCssQuotedValue(src.url);
      const format = escapeCssQuotedValue(src.format);
      const prefix = idx > 0 ? '  ' : '';

      return `${prefix}url('${url}') format('${format}')`;
    })
    .join(',\n');

  fontFaceBody.push(`src: ${srcDeclarations};`);

  return `@font-face {\n${fontFaceBody.join('\n')}\n}`;
};

const generateFontFaceStyleElement = (fontFaces: WebIDEFontFace[]) => {
  const styleElement = document.createElement('style');

  styleElement.innerHTML = fontFaces.map(getFontFaceDefinition).join('\n');

  return styleElement;
};

export const loadGitLabFonts = (fontFaces: WebIDEFontFace[] | undefined): void => {
  if (!fontFaces || fontFaces.length === 0) return;

  fontFaces.flatMap(getFontPreloadElements).forEach(element => {
    document.head.appendChild(element);
  });

  document.head.appendChild(generateFontFaceStyleElement(fontFaces));
};
