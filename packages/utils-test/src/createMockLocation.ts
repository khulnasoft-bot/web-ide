export const createMockLocation = (overrides: Partial<Location> = {}): Partial<Location> => {
  const { ancestorOrigins, hash, host, hostname, href, origin, pathname, port, protocol, search } =
    window.location;

  const location = {
    ancestorOrigins,
    hash,
    host,
    hostname,
    href,
    origin,
    pathname,
    port,
    protocol,
    search,
    ...overrides,
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  };

  return location;
};
