import { validate } from 'class-validator';
import { IsBool } from './bool.validator';

class ClassWithoutOptions {
  @IsBool() prop: boolean;
}
class ClassWithNullOptions {
  @IsBool(null) prop: boolean;
}
class ClassWithUndefinedOptions {
  @IsBool(undefined) prop: boolean;
}
class ClassWithEmptyOptions {
  @IsBool({}) prop: boolean;
}
class ClassWithOptionalFalse {
  @IsBool({ optional: false }) prop: boolean;
}
class ClassWithOptionalTrue {
  @IsBool({ optional: true }) prop: boolean;
}

describe('IsBool', () => {
  it('should be defined', () => {
    expect(IsBool).toBeDefined();
  });

  it('should return a function', () => {
    expect(typeof IsBool()).toEqual('function');
  });

  describe.each([
    {
      description: 'without options',
      Clazz: ClassWithoutOptions,
      shouldAcceptUndefined: false,
    },
    {
      description: 'options=null',
      Clazz: ClassWithNullOptions,
      shouldAcceptUndefined: false,
    },
    {
      description: 'options=undefined',
      Clazz: ClassWithUndefinedOptions,
      shouldAcceptUndefined: false,
    },
    {
      description: 'options={}',
      Clazz: ClassWithEmptyOptions,
      shouldAcceptUndefined: false,
    },
    {
      description: 'options={optional: false}',
      Clazz: ClassWithOptionalFalse,
      shouldAcceptUndefined: false,
    },
    {
      description: 'options={optional: true}',
      Clazz: ClassWithOptionalTrue,
      shouldAcceptUndefined: true,
    },
  ])('$description', ({ Clazz, shouldAcceptUndefined }) => {
    it('should validade when value is true', async () => {
      const dto = new Clazz();
      dto.prop = true;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validade when value is false', async () => {
      const dto = new Clazz();
      dto.prop = false;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validade when value is null', async () => {
      const dto = new Clazz();
      dto.prop = null;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('prop');
      expect(errors[0].constraints).toEqual({ isBool: 'prop is required' });
      expect(errors[0].target).toEqual({ prop: null });
      expect(errors[0].value).toEqual(null);
    });

    it('should not validade when value is undefined', async () => {
      const dto = new Clazz();
      dto.prop = undefined;
      const errors = await validate(dto);
      if (shouldAcceptUndefined) {
        expect(errors).toHaveLength(0);
      } else {
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('prop');
        expect(errors[0].constraints).toEqual({ isBool: 'prop is required' });
        expect(errors[0].target).toEqual({ prop: undefined });
        expect(errors[0].value).toEqual(undefined);
      }
    });

    it('should not validade when value is not defined', async () => {
      const dto = new Clazz();
      const errors = await validate(dto);
      if (shouldAcceptUndefined) {
        expect(errors).toHaveLength(0);
      } else {
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('prop');
        expect(errors[0].constraints).toEqual({ isBool: 'prop is required' });
        expect(errors[0].target).toEqual({ prop: undefined });
        expect(errors[0].value).toEqual(undefined);
      }
    });

    it('should not validade when value type is invalid', async () => {
      const dto = new Clazz();
      dto.prop = {} as boolean;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('prop');
      expect(errors[0].constraints).toEqual({ isBool: 'prop is invalid' });
      expect(errors[0].target).toEqual({ prop: {} });
      expect(errors[0].value).toEqual({});
    });
  });

  it('should use custom property name', async () => {
    class Clazz {
      @IsBool({ optional: false, customPropertyName: 'Active' })
      prop: boolean;
    }
    const dto = new Clazz();
    dto.prop = {} as boolean;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isBool: 'Active is invalid',
    });
    expect(errors[0].target).toEqual({ prop: {} });
    expect(errors[0].value).toEqual({});
  });

  it('should use custom required message', async () => {
    class Clazz {
      @IsBool({
        optional: false,
        requiredMessage: 'Bar is required',
        invalidTypeMessage: 'Bar must be boolean',
      })
      prop: boolean;
    }
    const dto = new Clazz();
    dto.prop = null;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isBool: 'Bar is required',
    });
    expect(errors[0].target).toEqual({ prop: null });
    expect(errors[0].value).toEqual(null);
  });

  it('should use custom invalid message', async () => {
    class Clazz {
      @IsBool({
        optional: false,
        requiredMessage: 'Bar is required',
        invalidTypeMessage: 'Bar must be boolean',
      })
      prop: boolean;
    }
    const dto = new Clazz();
    dto.prop = {} as boolean;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isBool: 'Bar must be boolean',
    });
    expect(errors[0].target).toEqual({ prop: {} });
    expect(errors[0].value).toEqual({});
  });
});
