import { kebabCase } from './kebabCase';

describe('kebabCase', () => {
  it.each([
    ['test', 'test'],
    ['fooBar', 'foo-bar'],
    ['fontFeatureSettings', 'font-feature-settings'],
    ['PascalCase', 'pascal-case'],
    ['innerHTML', 'inner-h-t-m-l'],
  ])('kebabCase(%p) === %p', (orig, kebabbed) => {
    expect(kebabCase(orig)).toBe(kebabbed);
  });
});
