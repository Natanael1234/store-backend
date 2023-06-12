export function getBooleanTransformer(options?: { defaultValue?: boolean }) {
  return (value: any) => {
    if (value === undefined) {
      if (options) {
        return options.defaultValue;
      } else {
        return false;
      }
    } else if (typeof value == 'string') {
      value = value.toLowerCase();
      if (value == 'true') {
        return true;
      } else if (value == 'false') {
        return false;
      }
      return value;
    } else if (typeof value == 'boolean') {
      return value;
    }
    return value;
  };
}
