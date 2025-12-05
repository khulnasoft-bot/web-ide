type define2Arg = <T = void>(path: string, func: () => T) => void;
type define3Arg = <DepPaths extends string[], Deps extends unknown[], T = void>(
  path: string,
  dependencies: DepPaths,
  func: (...deps: Deps) => T,
) => void;

export type defineType = define2Arg & define3Arg;
export type requireType = {
  config(options: unknown): void;
};
