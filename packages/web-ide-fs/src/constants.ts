export { ErrorCode } from 'browserfs/dist/node/core/api_error';

/**
 * Default file permission numeric mode
 *
 * https://www.gnu.org/software/findutils/manual/html_node/find_html/Numeric-Modes.html
 */
export const MODE_DEFAULT = 0x644;

// why: BrowserFS converts the mode into this format sometimes, so we save it here for readability in tests
export const MODE_DEFAULT_FULL = 0o100644;

export const MODE_WRITABLE = 0x222;
