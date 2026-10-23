//---------------------------
// Shared Typescript Config
//---------------------------
const typescriptSharedConfig = {
  extends: 'plugin:@typescript-eslint/strict',
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  // https://typescript-eslint.io/packages/parser/#configuration
  parserOptions: {
    project: ['./tsconfig.eslint.json', './packages/**/tsconfig.json'],
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
    },
  },
  rules: {
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/return-await': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'separate-type-imports', disallowTypeAnnotations: true },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
    ],
    'playwright/no-skipped-test': [
      'error',
      {
        allowConditional: true,
      },
    ],
  },
};

module.exports = {
  //---------------------------
  // Globally Shared Config
  //---------------------------
  extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
  plugins: ['import'],
  ignorePatterns: [
    'packages/**/lib/**',
    'packages/**/test-utils/**',
    'packages/**/dist',
    'tmp/**/*',
    'gitlab-vscode-extension',
  ],
  env: {
    // NOTE: The env setting should be kept consistent with the `lib` entry in `tsconfig.base.json`
    es2020: true,
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', { js: 'never', ts: 'never' }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'tests/integration/**/*',
          '**/*.test.ts',
          '**/scripts/**',
          '**/*.config.ts',
          'jest.domenvironment.js',
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: ':matches(PropertyDefinition, MethodDefinition)[accessibility="private"]',
        message: 'Use # prefix instead of `private` to indicate private class members.',
      },
      // the remaining no-restricted-syntax rules are copied from airbnb-base
      // https://github.com/airbnb/javascript/blob/01f046dc0567e4495762e8e4fc4dde7b87dd5eb8/packages/eslint-config-airbnb-base/rules/style.js#L342C1-L357
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'import/no-unresolved': [2, { ignore: ['vscode'] }],
    'import/prefer-default-export': 'off',
    'no-shadow': 'warn',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'warn',
    'no-useless-constructor': 'off',
  },
  reportUnusedDisableDirectives: true,
  overrides: [
    //---------------------------
    // Non-Jest Typescript Config
    //---------------------------
    {
      files: ['**/*.ts'],
      ...typescriptSharedConfig,
    },

    //---------------------------
    // Jest Typescript Config
    //---------------------------
    {
      files: ['**/packages/*.test.ts', '**/__mocks__/*'],
      env: {
        jest: true,
      },
      ...typescriptSharedConfig,
      settings: {
        ...typescriptSharedConfig.settings,
        'import/resolver': {
          node: {
            extensions: ['.js', '.ts'],
          },
        },
      },
    },

    //---------------------------
    // Playwright Typescript Config
    //---------------------------
    {
      files: ['**/tests/integration/*.test.ts'],
      ...typescriptSharedConfig,
      extends: ['plugin:playwright/recommended'],
    },

    //---------------------------
    // Javascript Config
    //---------------------------
    {
      files: ['**/*.js'],
      settings: {
        'import/resolver': {
          node: {
            extensions: ['.js'],
          },
        },
      },
      parserOptions: {
        // NOTE: "ecmaVersion: 2020" is needed in order to avoid the error
        //       "ESLint: Parsing error: Unexpected token ." when using the Optional Chaining `?.`
        //       operator in `*.js` files. It is required even though `env: { es2020: true }` is in
        //       the global config, which should automatically set `ecmaVersion: 2020` according to
        //       https://eslint.org/docs/latest/user-guide/configuring/language-options#specifying-environments
        ecmaVersion: 2020,
      },
      rules: {
        'no-console': 'off', // `no-console': 'off` so we can output from js build/utility scripts
      },
    },
  ],
};
