import {
  positiveRegexErrorMessage,
  negativeRegexErrorMessage,
  lintCommit,
  asRegExp,
} from './lintCommit';

const types = ['feat', 'chore', 'fix', 'test'];
const commitTypeRegex = Object.values(types).join('|');
const TEST_PUSH_RULES = {
  commit_message_regex: `^(${commitTypeRegex})(\\([^()]+\\))?(!)?: `,
  commit_message_negative_regex: '(ssh)(!)?',
};
const TEST_PUSH_RULES_EMPTY = {
  commit_message_regex: '',
  commit_message_negative_regex: '',
};
const TEST_PUSH_RULES_UNDEFINED = {
  commit_message_regex: undefined,
  commit_message_negative_regex: null,
};
const INVALID_REGEX_PUSH_RULES = {
  commit_message_regex: 'x{5-3} reg',
  commit_message_negative_regex: '^3+x n',
};

describe('scm/commit/lintCommit', () => {
  it.each`
    input                                                                       | output
    ${{ value: '$%4Commit!(!!diq)![]\nsh' }}                                    | ${''}
    ${{ value: 'Commit', pushRules: undefined }}                                | ${''}
    ${{ value: 'Commit message', INVALID_REGEX_PUSH_RULES }}                    | ${''}
    ${{ value: 'Commit', pushRules: TEST_PUSH_RULES_EMPTY }}                    | ${''}
    ${{ value: 'Commit message', TEST_PUSH_RULES_UNDEFINED }}                   | ${''}
    ${{ value: 'feat: Commit message', pushRules: undefined }}                  | ${''}
    ${{ value: 'feat: Commit message', pushRules: TEST_PUSH_RULES }}            | ${''}
    ${{ value: 'chore: Commit message', pushRules: TEST_PUSH_RULES }}           | ${''}
    ${{ value: 'feat!: Commit message', pushRules: TEST_PUSH_RULES }}           | ${''}
    ${{ value: 'fix(scope): Commit message', pushRules: TEST_PUSH_RULES }}      | ${''}
    ${{ value: 'feat(scope)!: Commit message', pushRules: TEST_PUSH_RULES }}    | ${''}
    ${{ value: 'feat: Commit message\n New line', pushRules: TEST_PUSH_RULES }} | ${''}
    ${{ value: 'Commit message', pushRules: TEST_PUSH_RULES }}                  | ${positiveRegexErrorMessage(TEST_PUSH_RULES.commit_message_regex)}
    ${{ value: 'ssh: Commit message', pushRules: TEST_PUSH_RULES }}             | ${positiveRegexErrorMessage(TEST_PUSH_RULES.commit_message_regex)}
    ${{ value: 'test(): Commit message', pushRules: TEST_PUSH_RULES }}          | ${positiveRegexErrorMessage(TEST_PUSH_RULES.commit_message_regex)}
    ${{ value: 'fix: ssh Commit message', pushRules: TEST_PUSH_RULES }}         | ${negativeRegexErrorMessage(TEST_PUSH_RULES.commit_message_negative_regex)}
    ${{ value: 'new line\n feat: Commit message', pushRules: TEST_PUSH_RULES }} | ${positiveRegexErrorMessage(TEST_PUSH_RULES.commit_message_regex)}
  `("Returns '$output' when input = '$input'", ({ input, output }) => {
    expect(lintCommit(input)).toBe(output);
  });
  it('displays helpful error message', () => {
    const actual = lintCommit({ value: 'Commit message', pushRules: TEST_PUSH_RULES });
    expect(actual).toMatchInlineSnapshot(`
      "⚠️ Commit message violates the project's push rules.
        Commit must match the following pattern: \\"^(feat|chore|fix|test)(\\\\([^()]+\\\\))?(!)?: \\""
    `);
    const actualNegative = lintCommit({
      value: 'fix: ssh Commit message',
      pushRules: TEST_PUSH_RULES,
    });
    expect(actualNegative).toMatchInlineSnapshot(`
      "⚠️ Commit message violates the project's push rules.
      Commit must not match the following pattern: \\"(ssh)(!)?\\""
    `);
  });
  it.each`
    input                                                      | output
    ${TEST_PUSH_RULES_EMPTY.commit_message_regex}              | ${null}
    ${TEST_PUSH_RULES_UNDEFINED.commit_message_regex}          | ${null}
    ${TEST_PUSH_RULES_UNDEFINED.commit_message_negative_regex} | ${null}
    ${TEST_PUSH_RULES.commit_message_regex}                    | ${new RegExp(TEST_PUSH_RULES.commit_message_regex)}
    ${INVALID_REGEX_PUSH_RULES.commit_message_regex}           | ${new RegExp(INVALID_REGEX_PUSH_RULES.commit_message_regex)}
  `("Returns '$output' when regex input = '$input'", ({ input, output }) => {
    expect(asRegExp(input)).toStrictEqual(output);
  });
});
