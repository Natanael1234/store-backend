import { getBooleanTransformer } from './boolean-transformer';

describe('arrayTransformer', () => {
  it('should be defined', () => {
    expect(getBooleanTransformer).toBeDefined();
  });

  it('should return a function', () => {
    const transformer = getBooleanTransformer({});
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  it('should return a function when receives options', () => {
    const transformer = getBooleanTransformer({});
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  it('should return a function when receives defaultValue', () => {
    const transformer = getBooleanTransformer({ defaultValue: false });
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  describe.each([
    { options: null, transformer: getBooleanTransformer(null) },
    { options: undefined, transformer: getBooleanTransformer(undefined) },
    { options: {}, transformer: getBooleanTransformer({}) },
    {
      options: { defaultValue: null },
      transformer: getBooleanTransformer({ defaultValue: null }),
    },
    {
      options: { defaultValue: undefined },
      transformer: getBooleanTransformer({ defaultValue: undefined }),
    },
    {
      options: { defaultValue: true },
      transformer: getBooleanTransformer({ defaultValue: true }),
    },
    {
      options: { defaultValue: false },
      transformer: getBooleanTransformer({ defaultValue: false }),
    },
  ])('options=$options', ({ transformer, options }) => {
    it('should return true when receives true', () => {
      expect(transformer(true)).toEqual(true);
    });

    it('should return when reveives "true"', () => {
      expect(transformer('true')).toEqual(true);
    });

    it('should return true when receives string true with upper case characters', () => {
      expect(transformer('tRuE')).toEqual(true);
    });

    // false

    it('should return false when receives false', () => {
      expect(transformer(false)).toEqual(false);
    });

    it('should return false when receives "false"', () => {
      expect(transformer('false')).toEqual(false);
    });

    it('should return false when receives string false with upper case characters', () => {
      expect(transformer('fAlSe')).toEqual(false);
    });

    it('should return default value when receives null', () => {
      if (options) {
        expect(transformer(null)).toEqual(null);
      } else {
        expect(transformer(null)).toEqual(null);
      }
    });

    it('should return default value when receives undefined', () => {
      if (options) {
        expect(transformer(undefined)).toEqual(options.defaultValue);
      } else {
        expect(transformer(undefined)).toEqual(false);
      }
    });

    // invalid

    it('should return invalid type when receives invalid type', () => {
      expect(transformer(0)).toEqual(0);
    });

    it('should return invalid string when receives invalid string', () => {
      expect(transformer('invalid')).toEqual('invalid');
    });
  });
});
