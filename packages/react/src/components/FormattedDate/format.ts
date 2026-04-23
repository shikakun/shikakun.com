export const format = (date: string): string => {
  const [datePart, timePart] = date.split(' ');
  const parts = datePart.split('-');
  const year = parseInt(parts[0], 10);

  if (timePart) {
    const [hours, minutes] = timePart.split(':').map(Number);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day, hours, minutes);
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${timeStr} · ${dateStr}`;
  }

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
