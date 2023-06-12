import {
  normalizePageSizeValue,
  normalizePageValue,
  normalizePaginationSkip,
  normalizePaginationTake,
} from './pagination-transformer';

describe('pagination-transformer', () => {
  const pageTests = [
    {
      valueDescription: '1',
      value: 1,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      description: '"1"',
      value: '1',
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: '2',
      value: 2,
      normalizedValue: 2,
      resultDescription: '2',
    },
    {
      valueDescription: '"2"',
      value: '2',
      normalizedValue: 2,
      resultDescription: '2',
    },
    {
      valueDescription: '0',
      value: 0,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: '"0"',
      value: '0',
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'negative',
      value: -1,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'string negative',
      value: '-1',
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'null',
      value: null,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'undefined',
      value: undefined,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'float',
      value: 1.1,
      normalizedValue: 1.1,
      resultDescription: 'float',
    },
    {
      valueDescription: 'string float',
      value: '1.1',
      normalizedValue: 1.1,
      resultDescription: 'float',
    },
    {
      valueDescription: 'negative float',
      value: -1.1,
      normalizedValue: -1.1,
      resultDescription: 'negative float',
    },
    {
      valueDescription: 'negative string float',
      value: '-1.1',
      normalizedValue: -1.1,
      resultDescription: 'negative float',
    },
    {
      valueDescription: 'large integer',
      value: 12000,
      normalizedValue: 12000,
      resultDescription: 'large integer',
    },
    {
      valueDescription: 'invalid string',
      value: 'invalid',
      normalizedValue: NaN,
      resultDescription: 'NaN',
    },
    {
      valueDescription: 'invalid type',
      value: {},
      normalizedValue: NaN,
      resultDescription: 'NaN',
    },
  ];

  function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  describe('normalizePageValue', () => {
    for (const pageTest of pageTests) {
      it(`should return ${pageTest.resultDescription} when page parameter is ${pageTest.valueDescription}`, () => {
        expect(normalizePageValue(pageTest.value)).toEqual(
          pageTest.normalizedValue,
        );
      });
    }
  });

  const pageSizeTests = [
    {
      valueDescription: '1',
      value: 1,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: '"1"',
      value: '1',
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: '2',
      value: 2,
      normalizedValue: 2,
      resultDescription: '2',
    },
    {
      valueDescription: '"2"',
      value: '2',
      normalizedValue: 2,
      resultDescription: '2',
    },
    {
      valueDescription: '0',
      value: 0,
      normalizedValue: 1,
      resultDescription: '0',
    },
    {
      valueDescription: '"0',
      value: '0',
      normalizedValue: 1,
      resultDescription: '0',
    },
    {
      valueDescription: 'negative',
      value: -1,
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'string negative',
      value: '-1',
      normalizedValue: 1,
      resultDescription: '1',
    },
    {
      valueDescription: 'null',
      value: null,
      normalizedValue: 12,
      resultDescription: '12',
    },
    {
      valueDescription: 'undefined',
      value: undefined,
      normalizedValue: 12,
      resultDescription: '12',
    },
    {
      valueDescription: 'float',
      value: 1.1,
      normalizedValue: 1.1,
      resultDescription: 'float',
    },
    {
      valueDescription: 'float string',
      value: '1.1',
      normalizedValue: 1.1,
      resultDescription: 'float',
    },
    {
      valueDescription: 'negative float',
      value: -1.1,
      normalizedValue: -1.1,
      resultDescription: 'negative float',
    },
    {
      valueDescription: 'negative string float',
      value: '-1.1',
      normalizedValue: -1.1,
      resultDescription: 'negative string float',
    },
    {
      valueDescription: 'invalid string',
      value: 'invalid',
      normalizedValue: NaN,
      resultDescription: 'NaN',
    },
    {
      valueDescription: 'invalid type',
      value: {},
      normalizedValue: NaN,
      resultDescription: 'invalid NaN',
    },
    {
      valueDescription: 'equal to maximum pageSize allowed as integer',
      value: 40,
      normalizedValue: 40,
      resultDescription: 'equal to maximum pageSize allowed as integer',
    },
    {
      valueDescription: 'maximum as string',
      value: '40',
      normalizedValue: 40,
      resultDescription: 'maximum as integer',
    },
    {
      valueDescription: 'integer greater than the maximum allowed',
      value: 41,
      normalizedValue: 40,
      resultDescription: 'maximum as integer',
    },
    {
      valueDescription: 'string integer greater than the maximum allowed',
      value: '41',
      normalizedValue: 40,
      resultDescription: 'maximum as integer',
    },
  ];

  describe('normalizePageSizeValue', () => {
    for (const pageSizeTest of pageSizeTests) {
      it(`should return ${pageSizeTest.resultDescription} when page Size parameter is ${pageSizeTest.valueDescription}`, () => {
        expect(normalizePageSizeValue(pageSizeTest.value)).toEqual(
          pageSizeTest.normalizedValue,
        );
      });
    }
  });

  describe('normalizePaginationSkip', () => {
    for (let page of pageTests) {
      for (let pageSize of pageSizeTests) {
        if (
          isNumber(page.normalizedValue) &&
          isNumber(pageSize.normalizedValue)
        ) {
          let expectedSkip =
            (+page.normalizedValue - 1) * +pageSize.normalizedValue;
          expectedSkip = expectedSkip == 0 ? 0 : expectedSkip;

          it(`should return ${expectedSkip} when page is ${page.valueDescription} and pageSize is ${pageSize.valueDescription}`, () => {
            const normalizedSkip = normalizePaginationSkip(
              page.value,
              pageSize.value,
            );
            expect(normalizedSkip).toEqual(expectedSkip);
          });
        } else {
          it(`should return NAN when page is ${page.valueDescription} and pageSize is ${pageSize.valueDescription}`, () => {
            const normalizedSkip = normalizePaginationSkip(
              page.value,
              pageSize.value,
            );
            expect(normalizedSkip).toEqual(NaN);
          });
        }
      }
    }
  });

  describe('normalizePaginationTake', () => {
    for (const pageSizeTest of pageSizeTests) {
      it(`should return ${pageSizeTest.resultDescription} when pageSize parameter is ${pageSizeTest.valueDescription}`, () => {
        expect(normalizePaginationTake(pageSizeTest.value)).toEqual(
          pageSizeTest.normalizedValue,
        );
      });
    }
  });
});
