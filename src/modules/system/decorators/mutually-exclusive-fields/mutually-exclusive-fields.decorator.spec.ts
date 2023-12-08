import { plainToInstance } from 'class-transformer';
import { MutuallyExclusiveFieldsMessage } from '../../messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { MutuallyExclusiveFields } from './mutually-exclusive-fields.decorator';

const Message = new MutuallyExclusiveFieldsMessage('field1', 'field2');

describe('Bool decorator', () => {
  it('should be defined', () => {
    expect(MutuallyExclusiveFields).toBeDefined();
  });

  it('should return a function', () => {
    expect(
      typeof MutuallyExclusiveFields({
        sourceField: 'field1',
        targetField: 'field2',
      }),
    ).toEqual('function');
  });

  it('should accept when decorated field is defined and referenced field is null', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: 'some value', field2: null };
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(data);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  });

  it('should accept when decorated field is defined and referenced field is undefined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: 'some value', field2: undefined };
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(data);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  });

  it('should accept when decorated field is null and referenced field is defined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: null, field2: 'some value' };
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(data);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  });

  it('should accept when decorated field is undefined and referenced field is defined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: undefined, field2: 'some value' };
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(data);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  });

  it('should reject when both decorated field and referenced field are null', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: null, field2: null };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.NONE_DEFINED,
    });
  });

  it('should reject when both decorated field is referenced field are undefined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: undefined, field2: undefined };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.NONE_DEFINED,
    });
  });

  it('should reject when decorated field is null and referenced field is undefined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: null, field2: undefined };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.NONE_DEFINED,
    });
  });

  it('should reject when decorated field is undefined and referenced field is null', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: undefined, field2: null };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.NONE_DEFINED,
    });
  });

  it('should reject when both decorated field and referenced field are defined', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: 'some value', field2: 'some other value' };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.BOTH_DEFINED,
    });
  });

  it('should reject when both decorated field and referenced field are defined as empty string', async () => {
    class TestDTO {
      @MutuallyExclusiveFields({ sourceField: 'field1', targetField: 'field2' })
      field1: string;
      field2: string;
    }
    const data = { field1: '', field2: '' };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isMutuallyExclusive: Message.BOTH_DEFINED,
    });
  });
});
