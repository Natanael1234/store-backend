export function getArrayTransformer(options?: {
  defaultValues?: any[];
  removeDuplicated?: boolean;
}) {
  return (value: any) => {
    const { removeDuplicated, defaultValues: defaultValue } = options || {};
    // if null,. undefined or empty
    if (value == null || value === '') {
      value = [];
    }
    // if string split into array
    else if (typeof value == 'string') {
      value = (value as string).split(',');
    }
    // wraps into array
    else if (!Array.isArray(value)) {
      value = [value];
    }

    // default value
    if (!value.length && defaultValue && defaultValue.length) {
      value.push(...defaultValue);
    }

    // remove duplicated
    if (removeDuplicated) {
      value = [...new Set(value)];
    }

    return value;
  };
}
