export function applyCurrentEndDateLabel(preview: string): string {
  const raw = typeof preview === 'string' ? preview : '';
  if (!raw.trim()) {
    return raw;
  }

  const lines = raw.split('\n').map(line => {
    let next = line;
    next = next.replace(/(\bbetween\s+.+?\s+and\s+)([^,\n]+(?:,\s*\d{4})?)/i, '$1Current');
    next = next.replace(/(\bup to\s+)([^,\n]+(?:,\s*\d{4})?)/i, '$1Current');
    next = next.replace(/(\bon\s+)([^,\n]+(?:,\s*\d{4})?)/i, '$1Current');
    return next;
  });

  return lines.join('\n');
}

