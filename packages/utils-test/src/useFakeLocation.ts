export const useFakeLocation = () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;

    const mutableLocation = {
      href: window.location.href,
    };
    Object.defineProperty(window, 'location', {
      get() {
        return mutableLocation;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      get() {
        return originalLocation;
      },
    });
  });
};
