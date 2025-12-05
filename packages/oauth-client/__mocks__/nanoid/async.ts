export const customAlphabet = jest
  .fn()
  .mockImplementation(letters => (size: number) => Promise.resolve(`${size}-${letters}`));
