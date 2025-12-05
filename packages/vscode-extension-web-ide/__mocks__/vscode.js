// FIXME!
/* eslint-disable @typescript-eslint/no-require-imports  */
const { EventEmitter } = require('../test-utils/EventEmitter');
const { FileSystemError } = require('../test-utils/FileSystemError');

function Uri(scheme, authority, path, query, fragment) {
  this.scheme = scheme;
  this.authority = authority;
  this.path = path;
  this.query = query;
  this.fragment = fragment;

  // https://sourcegraph.com/github.com/microsoft/vscode@bec7026dc99799b76fdf553c9f2bc250383a7f00/-/blob/src/vs/base/common/uri.ts?L205
  Object.defineProperty(this, 'fsPath', {
    get() {
      // Simulate windows to catch OS specific issues
      return this.path.replace('/', '\\');
    },
  });
}

Uri.parse = function parse(str) {
  const url = new URL(str);

  return new Uri(url.protocol.replace(/:/g, ''), url.host, url.pathname, url.search, url.hash);
};

Uri.from = function from({ scheme = '', authority = '', path = '', query = '', fragment = '' }) {
  return new Uri(scheme, authority, path, query, fragment);
};

Uri.prototype.toString = function toString() {
  return `${this.scheme}://${this.authority}/${this.path}?${this.query}#${this.fragment}`;
};

Uri.prototype.with = function uriWith(params) {
  const args = ['scheme', 'authority', 'path', 'query', 'fragment'].map(key =>
    key in params ? params[key] : this[key],
  );

  return new Uri(...args);
};

function Range(startLine, startCharacter, endLine, endCharacter) {
  this.startLine = startLine;
  this.startCharacter = startCharacter;
  this.endLine = endLine;
  this.endCharacter = endCharacter;
}

function InlineCompletionItem(insertText, range) {
  this.insertText = insertText;
  this.range = range;
}

module.exports = {
  EventEmitter,
  scm: {
    createSourceControl: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  window: {
    registerFileDecorationProvider: jest.fn(),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    showTextDocument: jest.fn(),
    withProgress: jest.fn(),
    createStatusBarItem: jest.fn(),
    createInputBox: jest.fn(),
    createQuickPick: jest.fn(),
  },
  workspace: {
    registerFileSystemProvider: jest.fn(),
    createFileSystemWatcher: jest.fn(),
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    fs: {
      stat: jest.fn(),
      isWritableFileSystem: jest.fn(),
      readFile: jest.fn(),
    },
  },
  env: {
    openExternal: jest.fn(),
  },
  authentication: {
    registerAuthenticationProvider: jest.fn().mockReturnValue({
      dispose: jest.fn(),
    }),
  },
  Uri,
  FileDecoration: function FileDecoration(letter, tooltip, color) {
    this.letter = letter;
    this.tooltip = tooltip;
    this.color = color;
  },
  FileSystemError,
  FileType: {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
  },
  FileChangeType: {
    Changed: 0,
    Created: 1,
    Deleted: 2,
  },
  ExtensionKind: {
    UI: 1,
    Workspace: 2,
  },
  extensions: {
    getExtension: jest.fn(),
    onDidChange: jest.fn(),
  },
  Disposable: {
    from(...disposables) {
      return {
        dispose() {
          disposables.forEach(x => x.dispose());
        },
      };
    },
  },
  ProgressLocation: {
    SourceControl: 1,
    Window: 10,
    Notification: 15,
  },
  ThemeColor: function ThemeColor(name) {
    this.name = name;
  },
  ThemeIcon: function ThemeIcon(name) {
    this.name = name;
  },
  StatusBarAlignment: {
    Left: 0,
    Right: 1,
  },
  InlineCompletionTriggerKind: {
    Automatic: true,
  },
  Range,
  InlineCompletionItem,
  ConfigurationTarget: {
    Global: 1,
  },
  ConfigurationChangeEvent: {
    affectsConfiguration: jest.fn(),
  },
};
