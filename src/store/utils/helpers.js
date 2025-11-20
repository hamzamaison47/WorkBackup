/* eslint-disable curly */
export const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);

// Get user initials
export const getInitials = name => {
  if (!name) return 'UN';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Calculate years since hire
export const calculateYearsSinceHire = hireDateString => {
  if (!hireDateString) return 0;

  const hire = new Date(hireDateString);
  const today = new Date();

  let years = today.getFullYear() - hire.getFullYear();
  let months = today.getMonth() - hire.getMonth();
  let days = today.getDate() - hire.getDate();

  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }

  return (years + months / 12).toFixed(1);
};
