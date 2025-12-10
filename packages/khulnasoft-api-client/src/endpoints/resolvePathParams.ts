const VAR_OPTION_SKIP_ENCODE = 'skipEncode';

const getQueryParams = (params: Record<string, string>, keys: Set<string>) => {
  if (keys.size === 0) {
    return '';
  }

  const urlSearchParams = new URLSearchParams();
  keys.forEach(key => {
    urlSearchParams.append(key, params[key]);
  });

  return `?${urlSearchParams.toString()}`;
};

const parsePathVariableOptions = (pathVarOptionsStr: string): string[] => {
  if (pathVarOptionsStr) {
    // Strip wrapping parenthesis and split on `,`
    return pathVarOptionsStr.substring(1, pathVarOptionsStr.length - 1).split(',');
  }

  return [];
};

export const resolvePathParams = (path: string, params: Record<string, string> = {}) => {
  const remainingKeys = new Set(Object.keys(params));

  const pathWithParams = path.replace(
    /:(\(.+?\))?([\w_]+)/g,
    (substring: string, pathVarOptionsStr: string, pathVar: string) => {
      if (pathVar in params) {
        remainingKeys.delete(pathVar);

        const value = params[pathVar];
        const pathVarOptions = parsePathVariableOptions(pathVarOptionsStr);
        const shouldEncode = !pathVarOptions.includes(VAR_OPTION_SKIP_ENCODE);

        return shouldEncode ? encodeURIComponent(value) : value;
      }

      return substring;
    },
  );

  const query = getQueryParams(params, remainingKeys);

  return `${pathWithParams}${query}`;
};
