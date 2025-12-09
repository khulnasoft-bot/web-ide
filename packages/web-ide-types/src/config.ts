import type { TrackingEvent } from './instrumentation';
import type { FeatureFlags } from './features';
import type { ExtensionMarketplaceSettings } from './extensionMarketplace';
import type { LogLevel } from './vscode';
import type { ErrorType } from './error';

export interface OAuthConfig {
  type: 'oauth';

  /**
   * Client ID of the OAuth application
   */
  clientId: string;

  /**
   * Preconfigured Callback URL (aka Redirect URI) for the OAuth application
   */
  callbackUrl: string;

  /**
   * (Optional) Flag for whether the refresh token should be persisted or not.
   *
   * If the flag is false, we still persist the access token, but we will
   * attempt to silently reauthorize if the token is about to expire.
   */
  protectRefreshToken?: boolean;

  /**
   * (Optional) overwrites the default `expiresIn` for the token whenever
   * a new one is granted. Helpful for testing refresh behavior.
   */
  tokenLifetime?: number;
}

export interface TokenAuthConfig {
  type: 'token';

  /**
   * Access token for the account
   */
  token: string;
}

export type AuthConfig = OAuthConfig | TokenAuthConfig;
export type AuthType = AuthConfig['type'];

export interface WebIdeConfigLinks {
  feedbackIssue: string;
  userPreferences: string;
  signIn: string;
  documentation?: string;
}

interface FontSrc {
  /**
    Contains the full URL of the font resource.
    It's used in the preload link and in the @font-face/src/url CSS attribute.
   */
  url: string;

  /**
    Specifies the mime type in preload link (type='font/${format}') and
    in the @font-face/src/format CSS attribute.
    For available values, check https://www.iana.org/assignments/media-types/media-types.xhtml#font
  */
  format: string;
}

/**
 * A font face definition based on the FontFace interface, which is itself
 * a representation of the @font-face CSS rule.
 *
 * Values here are mostly used to construct @font-face CSS rules, but also for
 * preload hints and the editor font family setting.
 *
 * We set most properties of FontFace to be optional, and we also omit some:
 *  - `load`, `loaded` and `status` aren't relevant to the CSS rule;
 *  - `variant` is no longer a CSS descriptor, but a value property (i.e., not
 *     to be used in @font-face rules).
 *
 * See also:
 * - https://drafts.csswg.org/css-font-loading/#fontface-interface for more
 *   details about possible properties.
 * - https://developer.mozilla.org/en-US/docs/Glossary/CSS_Descriptor
 */
export interface WebIDEFontFace
  extends Omit<Partial<FontFace>, 'load' | 'loaded' | 'status' | 'variant'> {
  /**
    Used in the VS Code settings.json (e.g. as 'editor.fontFamily').
    It will also be used in the @font-face/font-family CSS attribute.
    The `Partial` makes it optional, so override it here to make it required.
  */
  family: FontFace['family'];

  src: FontSrc[];
}

export interface ForkInfo {
  // This will be truthy if the fork exists
  ide_path?: string;

  // This will be truthy if the fork doesn't exist and the user can fork
  fork_path?: string;
}

export type ContextUpdatePayload = {
  ref: string;
  projectPath: string;
};

export interface WebIdeConfig {
  /**
   * @deprecated This property is deprecated. Use workbenchBaseUrl
   * and embedderOriginUrl instead.
   */
  baseUrl?: string;

  /**
   * URL pointing to the origin and base path where the
   * Web IDE's workbench assets are hosted.
   */
  workbenchBaseUrl: string;

  /**
   * URL pointing to the system embedding the Web IDE. Most of the
   * time, but not necessarily, is a KhulnaSoft instance.
   */
  embedderOriginUrl: string;

  /**
   * URL pointing to the origin and the base path where
   * the Web IDE's extensions host assets are hosted.
   */
  extensionsHostBaseUrl: string;

  /**
   * URL pointing to the origin of the KhulnaSoft instance.
   * It is used for API access.
   */
  gitlabUrl: string;

  /**
   * Enables creating a separate origin for each extension
   * and web view.
   */
  crossOriginExtensionHost: boolean;

  nonce?: string;

  handleError?: (errorType: ErrorType) => void;
  handleTracking?: (event: TrackingEvent) => void;
  links: WebIdeConfigLinks;
  /** Contains fonts to be used in VS Code Text Editors */
  editorFont?: {
    fallbackFontFamily: string;
    fontFaces: WebIDEFontFace[];
  };

  /**
   * @deprecated This property is deprecated. Use extensionMarketplaceSettings instead.
   * https://gitlab.com/gitlab-org/gitlab/-/issues/512642
   */
  extensionsGallerySettings?: ExtensionMarketplaceSettings;
  extensionMarketplaceSettings?: ExtensionMarketplaceSettings;

  settingsContextHash?: string;
  featureFlags?: Partial<Record<FeatureFlags, boolean>>;
  vscodeLogLevel?: LogLevel;

  // projectPath - The path_with_namespace of the project to open
  projectPath: string;

  // codeSuggestionsEnabled - Boolean for whether code suggestion feature should be enabled
  codeSuggestionsEnabled?: boolean;

  // auth - Configuration for authentication. If not provided, the Web IDE will be read-only.
  auth: AuthConfig;

  // filePath - Default file path to open
  filePath?: string;

  // mrId - If opening from an MR, the ID of the MR
  mrId?: string;

  // mrTargetProject - If opening from an MR, the project path of the MR
  mrTargetProject?: string;

  // ref - If not coming from an MR, the branch ref to open
  ref?: string;

  // httpHeaders - Extra headers to pass with api requests (for example, csrf headers)
  httpHeaders?: Record<string, string>;

  // forkInfo - Fork information for the given projectPath. This follows the pre-existing
  //            interface used in the old Web IDE
  //            https://gitlab.com/gitlab-org/gitlab/-/blob/dd1e70d3676891025534dc4a1e89ca9383178fe7/app/assets/javascripts/ide/stores/getters.js#L24
  forkInfo?: ForkInfo;

  // username - The current username for the KhulnaSoft context. This is used for things like
  //            generating default branch names.
  //            https://gitlab.com/khulnasoft/web-ide/-/issues/82
  username?: string;

  // telemetryEnabled - This property is a boolean that indicates if telemetry is enabled
  //                      and bases its value on the web browser's do not track signal.
  //                    The single source of truth to determine if telemetry is enabled in
  //                    in the Web IDE is GitLab's tracking module.
  //                    See https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/assets/javascripts/tracking/tracker.js#L26
  telemetryEnabled?: boolean;
  // handleContextUpdate - This property is a function that gets invoked upon `khulnasoft-web-ide.update-web-ide-context`
  //                     VSCode mediator command execution.
  handleContextUpdate?: (payload: ContextUpdatePayload) => void;
}

/**
 * Serializable version of the Config.
 *
 * It cannot have callbacks since it passes through some serialization layers.
 */
export type SerializableConfig = Omit<
  WebIdeConfig,
  'handleError' | 'handleTracking' | 'handleContextUpdate'
>;
/**
 * This is the config passed into the Web IDE extension itself.
 */
export interface WebIdeExtensionConfig extends SerializableConfig {
  /**
   * This is the directory we'll use in the FileSystem to house the repo.
   *
   * It is calculated by the `vscode-bootstrap` package.
   */
  repoRoot: string;
}

/**
 * Config used for the oauthCallback entrypoint of the Web IDE.
 *
 * NOTE: Not used yet. See https://gitlab.com/khulnasoft/web-ide/-/merge_requests/240 for upcoming changes.
 */
export type OAuthCallbackConfig = Pick<WebIdeConfig, 'gitlabUrl' | 'auth' | 'username'>;
