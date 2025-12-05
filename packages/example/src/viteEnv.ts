// NOTE: Jest has a hard time reading import.meta, so let's just
// move this to it's own module for easy mocking.
export const viteEnv = import.meta.env;
