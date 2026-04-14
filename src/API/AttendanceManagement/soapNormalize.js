export const removeNamespace = key => {
  return key.includes(':') ? key.split(':')[1] : key;
};

export const normalizeValue = value => {
  // Return null (not []) for absent/empty values so that downstream truthiness
  // checks (e.g. !net.BSSID) behave correctly. An empty array is truthy and
  // would be misinterpreted as a configured-but-empty BSSID.
  if (value === null || value === undefined || value === '') return null;

  if (value === 'Yes') return 1;
  if (value === 'No') return 0;

  if (typeof value === 'string' && !isNaN(value)) {
    return Number(value);
  }

  return value;
};

export const normalizeObject = obj => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeObject);
  }

  // IMPORTANT: typeof null === 'object' in JavaScript. Without this guard,
  // null values would be processed as objects and wrapped in [null] arrays,
  // causing downstream flatMap calls to crash on null.property access.
  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);

    // 🔹 Auto-flatten SOAP wrappers like:
    // { DFGeoFencesNetworksSvcContract: [ ... ] }
    if (keys.length === 1 && Array.isArray(obj[keys[0]])) {
      return normalizeObject(obj[keys[0]]);
    }

    const newObj = {};

    keys.forEach(key => {
      const cleanKey = removeNamespace(key);
      const value = obj[key];

      // Preserve null/undefined without wrapping in arrays
      if (value === null || value === undefined) {
        newObj[cleanKey] = null;
      } else if (typeof value === 'object') {
        const normalized = normalizeObject(value);

        if (normalized === null || normalized === undefined) {
          // normalizeObject returned null (e.g. the value was an empty wrapper)
          newObj[cleanKey] = null;
        } else if (Array.isArray(normalized)) {
          newObj[cleanKey] = normalized;
        } else {
          newObj[cleanKey] = [normalized];
        }
      } else {
        newObj[cleanKey] = normalizeValue(value);
      }
    });

    return newObj;
  }

  return normalizeValue(obj);
};
