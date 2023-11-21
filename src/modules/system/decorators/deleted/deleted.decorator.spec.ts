import { plainToInstance } from 'class-transformer';
import { DeletedFilter } from '../../enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { Deleted } from './deleted.decorator';

const DeletedMessage = new BoolMessage('deleted');

describe('Deleted decorator', () => {
  it('should be defined', () => {
    expect(Deleted).toBeDefined();
  });

  async function testAccept(
    data: { deleted?: 'all' | 'deleted' | 'not_deleted' },
    expected: { deleted?: 'all' | 'deleted' | 'not_deleted' },
  ) {
    class Clazz {
      @Deleted() deleted: DeletedFilter;
    }

    const errors = await validateFirstError(data, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, data);
    expect(dto).toEqual(expected);
  }

  async function testReject(data: { deleted?: DeletedFilter }, constraints) {
    class Clazz {
      @Deleted() deleted: DeletedFilter;
    }
    const errors = await validateFirstError(data, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('deleted');
    expect(errors[0].value).toEqual(data.deleted);
    expect(errors[0].constraints).toEqual(constraints);
  }

  it(`should pass validation and return "${DeletedFilter.NOT_DELETED}" when deleted = null`, async () => {
    await testAccept({ deleted: null }, { deleted: DeletedFilter.NOT_DELETED });
  });

  it(`should pass validation and return "${DeletedFilter.NOT_DELETED}" when deleted = undefined`, async () => {
    await testAccept(
      { deleted: undefined },
      { deleted: DeletedFilter.NOT_DELETED },
    );
  });

  it(`should pass validation and return "${DeletedFilter.NOT_DELETED}" when deleted = "not_deleted"`, async () => {
    await testAccept(
      { deleted: 'not_deleted' },
      { deleted: DeletedFilter.NOT_DELETED },
    );
  });

  it(`should pass validation and return "${DeletedFilter.DELETED}" when deleted = "deleted"`, async () => {
    await testAccept(
      { deleted: 'deleted' },
      { deleted: DeletedFilter.DELETED },
    );
  });

  it(`should pass validation and return "${DeletedFilter.ALL}" when deleted = "all"`, async () => {
    await testAccept({ deleted: 'all' }, { deleted: DeletedFilter.ALL });
  });

  it('deleted is invalid string', async () => {
    await testReject(
      { deleted: 'nOt_DeLeTeD' as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted = ""', async () => {
    await testReject(
      { deleted: '' as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted is boolean', async () => {
    await testReject(
      { deleted: true as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted is boolean string', async () => {
    await testReject(
      { deleted: 'true' as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted is number', async () => {
    await testReject(
      { deleted: 4334556 as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted is object', async () => {
    await testReject(
      { deleted: {} as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });

  it('deleted is array', async () => {
    await testReject(
      { deleted: [] as unknown as DeletedFilter },
      { isEnum: DeletedMessage.INVALID },
    );
  });
});
