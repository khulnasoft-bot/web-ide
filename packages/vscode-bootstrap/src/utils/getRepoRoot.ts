export const getRepoRoot = (projectPath: string) => {
  const slashIdx = projectPath.lastIndexOf('/');
  if (slashIdx < 0) {
    return projectPath;
  }
  return projectPath.slice(slashIdx + 1);
};
