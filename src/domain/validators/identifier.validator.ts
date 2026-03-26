export function isValidIdentifier(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }
  if (name.length > 64) {
    return false;
  }
  if (/[`;]/.test(name)) {
    return false;
  }
  if (name.includes('--') || name.includes('/*')) {
    return false;
  }
  if (!/^[a-zA-Z0-9_.\-]+$/.test(name)) {
    return false;
  }
  return true;
}

export function quoteIdentifier(name: string): string {
  if (!isValidIdentifier(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  const escaped = name.replace(/`/g, '``');
  return `\`${escaped}\``;
}
