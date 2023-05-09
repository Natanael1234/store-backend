export function textSearchTransformer(text) {
  if (typeof text == 'string') {
    const stringWithoutDuplicateSpaces = text.replace(/\s+/g, ' ');
    const trimmedString = stringWithoutDuplicateSpaces.trim();
    return trimmedString;
  }
  return text;
}
