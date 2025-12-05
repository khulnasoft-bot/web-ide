import { generateBranchName } from './generateBranchName';

describe('scm/commit/generateBranchName', () => {
  it('generates random suffix', () => {
    expect(generateBranchName('ps-main')).toMatch(/^ps-main-patch-\w{4}$/);
  });

  it('subsequent calls are not equal', () => {
    expect(generateBranchName('ps-main')).not.toEqual(generateBranchName('ps-main'));
  });

  it('includes username when given', () => {
    expect(generateBranchName('main', 'loremipsum')).toMatch(/^loremipsum-main-patch-\w{4}$/);
  });
});
