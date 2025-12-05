export interface MediatorCommandExecutor {
  execute<T = unknown>(commandId: string, ...args: unknown[]): Promise<T>;
}
