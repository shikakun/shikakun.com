export const format = (date: string): string => {
  if (!date || typeof date !== 'string') {
    return '';
  }
  const [datePart, timePart] = date.split(' ');
  const parts = datePart.split('-');
  if (!parts.every((p) => /^\d+$/.test(p))) {
    return '';
  }
  const year = Number(parts[0]);
  if (Number.isNaN(year)) {
    return '';
  }

  const isValidDate = (y: number, m: number, d: number): boolean => {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  };

  if (timePart) {
    if (parts.length !== 3 || !/^\d{2}:\d{2}$/.test(timePart)) {
      return '';
    }

    const [hours, minutes] = timePart.split(':').map(Number);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (hours > 23 || minutes > 59 || !isValidDate(year, month, day)) {
      return '';
    }
    const d = new Date(year, month - 1, day, hours, minutes);
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

  const month = Number(parts[1]);
  if (parts.length === 2) {
    if (!isValidDate(year, month, 1)) {
      return '';
    }
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  const day = Number(parts[2]);
  if (!isValidDate(year, month, day)) {
    return '';
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
