// Take the last 4 characters of a random hex
const generateRandomPart = () => Math.random().toString(16).slice(-4);

export const generateBranchName = (branchName: string, username?: string) => {
  const prefix = username ? `${username}-` : '';

  return `${prefix}${branchName}-patch-${generateRandomPart()}`;
};
