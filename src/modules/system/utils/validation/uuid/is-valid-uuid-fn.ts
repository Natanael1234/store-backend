/**
 * Checks if value is a valid uuid.
 * To be a valid uuid the value must be a string with valid uuid format.
 * @param value value beind checked.
 * @returns true if value is valid uuid, false otherwise.
 */
export function isValidUUID(value: string): boolean {
  if (typeof value != 'string') {
    return false;
  }
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const valid = uuidPattern.test(value);
  return valid;
}
