export const format = (date: string): string => {
  const parts = date.split('-');
  const year = parseInt(parts[0], 10);
  if (parts.length === 1) {
    return `${year}`;
  }
  const month = parseInt(parts[1], 10) - 1;
  if (parts.length === 2) {
    return new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
