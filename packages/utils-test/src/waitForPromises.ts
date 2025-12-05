export const waitForPromises = () =>
  new Promise(resolve => {
    // Using setTimeout since setImmediate is not available in jsdom context
    setTimeout(resolve, 0);
  });
