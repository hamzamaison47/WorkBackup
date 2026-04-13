export const removeNamespace = key => {
  return key.includes(':') ? key.split(':')[1] : key;
};

export const normalizeValue = value => {
  if (value === null || value === undefined || value === '') return [];

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

  if (typeof obj === 'object' && obj !== null) {
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

      if (typeof value === 'object') {
        const normalized = normalizeObject(value);

        if (Array.isArray(normalized)) {
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
