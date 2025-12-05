import { escapeCssQuotedValue } from './escapeCssQuotedValue';

describe('utils/escape/escapeCssQuotedValue', () => {
  it('escapes single and double quotes', () => {
    expect(escapeCssQuotedValue(`http://comma/'"`)).toBe('http://comma/%27%22');
  });
});
