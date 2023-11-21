export function testConvertStaticPropertiesToObject(clazz) {
  const staticProperties: string[] = [];
  for (const propertyName in clazz) {
    if (
      clazz.hasOwnProperty(propertyName) &&
      typeof clazz[propertyName] !== 'function'
    ) {
      staticProperties.push(propertyName);
    }
  }
  const values = {};
  for (const property of staticProperties) {
    values[property] = clazz[property];
  }
  return values;
}
