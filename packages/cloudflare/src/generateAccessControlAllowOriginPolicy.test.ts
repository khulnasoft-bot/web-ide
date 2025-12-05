import { generateAccessControlAllowOriginPolicy } from './generateAccessControlAllowOriginPolicy';

describe('getAllowAccessControlAllowOriginPolicy', () => {
  it.each`
    env                                             | origin                                                                           | expected
    ${{}}                                           | ${'https://example.com'}                                                         | ${{}}
    ${{ ALLOWED_ORIGINS: '' }}                      | ${'https://example.com'}                                                         | ${{}}
    ${{ ALLOWED_ORIGINS: 'foo.com' }}               | ${'https://example.com'}                                                         | ${{}}
    ${{ ALLOWED_ORIGINS: 'foo.com' }}               | ${''}                                                                            | ${{}}
    ${{ ALLOWED_ORIGINS: '.foo.com' }}              | ${'https://example.com'}                                                         | ${{}}
    ${{ ALLOWED_ORIGINS: 'https://*.example.com' }} | ${'http://ide.example.com'}                                                      | ${{}}
    ${{ ALLOWED_ORIGINS: 'https://*.example.com' }} | ${'https://hola.ide.example.com'}                                                | ${{}}
    ${{ ALLOWED_ORIGINS: 'https://*.example.com' }} | ${'https://ide.example.com'}                                                     | ${{ 'access-control-allow-origin': 'https://ide.example.com' }}
    ${{ ALLOWED_ORIGINS: 'https://*.example.com' }} | ${'https://v--1sd9dj5fv66oih020o5mb3llcvp67lvcaue7f0fm01j3qhahbt3i.example.com'} | ${{ 'access-control-allow-origin': 'https://v--1sd9dj5fv66oih020o5mb3llcvp67lvcaue7f0fm01j3qhahbt3i.example.com' }}
    ${{ ALLOWED_ORIGINS: 'https://example.com' }}   | ${'https://example.com'}                                                         | ${{ 'access-control-allow-origin': 'https://example.com' }}
  `(
    'should return $expected when env is $env and origin is $origin',
    ({ env, origin, expected }) => {
      expect(generateAccessControlAllowOriginPolicy(env, origin)).toStrictEqual(expected);
    },
  );
});
