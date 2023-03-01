export const isNewLine = (c: string): boolean => /^[\n\r]$/.test(c);

export const isWordPart = (c?: string): boolean =>
  c != null && /^[^:;\s]$/.test(c);
