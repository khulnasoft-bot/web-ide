const pascalOrCamelCaseBoundary = /\B([A-Z])/g;

/**
 * A simple (naive) kebab-caser.
 *
 * Known limitations include not intelligently handling consecutive uppercase
 * characters.
 */
export const kebabCase = (str: string) =>
  str.replace(pascalOrCamelCaseBoundary, '-$1').toLowerCase();
