import { plainToInstance } from 'class-transformer';
import { TestDtoActiveFilter } from '../../../../test/filtering/active/test-dto-active-filter';
import { ActiveFilter } from '../../enums/filter/active-filter/active-filter.enum';
import { validateFirstError } from '../../utils/validation';
import { Active } from './active.decorator';

describe('Active decorator', () => {
  it('should be defined', () => {
    expect(Active).toBeDefined();
  });

  const testActive = new TestDtoActiveFilter({});
  const accepts = testActive.acceptData;
  const rejects = testActive.errorData;

  it.each(accepts)(`$description`, async ({ data, expectedResult }) => {
    class Clazz {
      @Active() active: ActiveFilter;
    }
    const dtoData = { active: data.active };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ active: expectedResult.active });
  });

  it.each(rejects)('$description', async ({ data, constraints }) => {
    const dtoData = { active: data.active };
    class Clazz {
      @Active() active: ActiveFilter;
    }
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('active');
    expect(errors[0].value).toEqual(data.active);
    expect(errors[0].constraints).toEqual(constraints);
  });
});
