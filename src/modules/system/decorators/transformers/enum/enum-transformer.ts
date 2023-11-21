export function getEnumTransformer<Enum extends Record<string, string>>(
  enumerator: Enum,
  options?: { defaultValue?: Enum[keyof Enum] },
) {
  return (value: any) => {
    if (value == null) {
      return options?.defaultValue;
    } else if (typeof value == 'string') {
      return value;
    } else {
      const keys = Object.keys(enumerator);
      for (let key of keys) {
        if (value == enumerator[key]) {
          return enumerator[key];
        }
      }
    }
    return value;
  };
}
