import { escapeHtml } from './escapeHtml';

describe('utils/escape/escapeHtml', () => {
  it('escapes common HTML control characters', () => {
    expect(escapeHtml(`<script>a = b & '"\`'</script>`)).toBe(
      `&lt;script&gt;a &#x3D; b &amp; &#39;&quot;&#x60;&#39;&lt;&#x2F;script&gt;`,
    );
  });
});
