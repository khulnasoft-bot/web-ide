export interface UnloadPreventer {
  setShouldPrevent(val: boolean): void;
  dispose(): void;
}

export const createUnloadPreventer = (): UnloadPreventer => {
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    Object.assign(e, {
      returnValue: 'You might lose your changes. Are you sure you want to exit?',
    });
    return 'You might lose your changes. Are you sure you want to exit?';
  };

  return {
    setShouldPrevent(val: boolean) {
      if (val) {
        window.addEventListener('beforeunload', handler);
      } else {
        window.removeEventListener('beforeunload', handler);
      }
    },
    dispose() {
      window.removeEventListener('beforeunload', handler);
    },
  };
};
