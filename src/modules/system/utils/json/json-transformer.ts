export function getJSONTransformer(options?: {
  defaultValues?: any[];
  removeDuplicated?: boolean;
  useDefaulValuesInsteadOfEmptyArray?: boolean;
}) {
  return (value: any) => {
    if (value === '') {
      value = undefined;
    } else if (typeof value == 'string') {
      try {
        value = JSON.parse(value);
      } catch (error) {}
    }
    if ((value === null || value === undefined) && options?.defaultValues) {
      value = options.defaultValues;
    }
    if (Array.isArray(value) && typeof value !== 'string') {
      if (
        value.length == 0 &&
        options?.useDefaulValuesInsteadOfEmptyArray &&
        options?.defaultValues?.length
      ) {
        value = options.defaultValues;
      }
      if (options?.removeDuplicated) {
        value = [...new Set(value)];
      }
    }

    return value;
  };
}
