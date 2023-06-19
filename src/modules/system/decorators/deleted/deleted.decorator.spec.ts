import { plainToInstance } from 'class-transformer';
import { TestDtoDeletedFilter } from '../../../../test/filtering/deleted/test-dto-deleted-filter';
import { DeletedFilter } from '../../enums/filter/deleted-filter/deleted-filter.enum';
import { validateFirstError } from '../../utils/validation';
import { Deleted } from './deleted.decorator';

describe('Deleted decorator', () => {
  it('should be defined', () => {
    expect(Deleted).toBeDefined();
  });

  const testDeleted = new TestDtoDeletedFilter({});
  const accepts = testDeleted.acceptData;
  const rejects = testDeleted.errorData;

  it.each(accepts)(`$description`, async ({ data, expectedResult }) => {
    class Clazz {
      @Deleted() deleted: DeletedFilter;
    }
    const dtoData = { deleted: data.deleted };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ deleted: expectedResult.deleted });
  });

  it.each(rejects)('$description', async ({ data, constraints }) => {
    const dtoData = { deleted: data.deleted };
    class Clazz {
      @Deleted() deleted: DeletedFilter;
    }
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('deleted');
    expect(errors[0].value).toEqual(data.deleted);
    expect(errors[0].constraints).toEqual(constraints);
  });
});
