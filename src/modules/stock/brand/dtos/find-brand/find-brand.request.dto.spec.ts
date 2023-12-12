import { plainToInstance } from 'class-transformer';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { FindBrandRequestDTO } from './find-brand.request.dto';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

async function testAccept(
  data: FindBrandRequestDTO,
  expectedResult: FindBrandRequestDTO,
) {
  const dto = plainToInstance(FindBrandRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindBrandRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(data: any, constraints: { [type: string]: string }) {
  const errors = await validateFirstError(data, FindBrandRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindBrandRequestDTO', () => {
  it('should accept', async () => {
    const data = { active: 'all', deleted: 'not_deleted' };
    const dto = plainToInstance(FindBrandRequestDTO, data);
    expect(dto).toEqual({
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
    });
    const errors = await validateFirstError(data, FindBrandRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('active', () => {
    it('should accept when active is "all"', async () => {
      await testAccept(
        { active: ActiveFilter.ALL },
        { active: ActiveFilter.ALL, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should accept when active is "inactive"', async () => {
      await testAccept(
        { active: ActiveFilter.INACTIVE },
        { active: ActiveFilter.INACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should accept when active is "active"', async () => {
      await testAccept(
        { active: ActiveFilter.ACTIVE },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should replace null active with "active"', async () => {
      await testAccept(
        { active: null },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should replace undefined active with "active"', async () => {
      await testAccept(
        { active: undefined },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should reject when active is number', async () => {
      await testReject(
        { active: 1 as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is boolean', async () => {
      await testReject(
        { active: true as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        { active: [] as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        { active: {} as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is invalid string', async () => {
      await testReject(
        { active: 'invalid' as unknown as ActiveFilter },
        { isEnum: ActiveMessage.INVALID },
      );
    });
  });

  describe('deleted', () => {
    it('should accept when deleted is "all"', async () => {
      await testAccept(
        { deleted: DeletedFilter.ALL },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.ALL },
      );
    });

    it('should accept when deleted is "deleted"', async () => {
      await testAccept(
        { deleted: DeletedFilter.DELETED },
        {
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.DELETED,
        },
      );
    });

    it('should accept when deleted is "not_deleted"', async () => {
      await testAccept(
        { deleted: DeletedFilter.NOT_DELETED },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should replace null deleted with "not_deleted"', async () => {
      await testAccept(
        { deleted: null },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should replace undefined deleted with "not_deleted"', async () => {
      await testAccept(
        { deleted: undefined },
        { active: ActiveFilter.ACTIVE, deleted: DeletedFilter.NOT_DELETED },
      );
    });

    it('should reject when deleted is number', async () => {
      await testReject(
        { deleted: 1 as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is boolean', async () => {
      await testReject(
        { deleted: true as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is array', async () => {
      await testReject(
        { deleted: [] as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is object', async () => {
      await testReject(
        { deleted: {} as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });

    it('should reject when deleted is invalid string', async () => {
      await testReject(
        { deleted: 'invalid' as unknown as DeletedFilter },
        { isEnum: DeletedMessage.INVALID },
      );
    });
  });

  describe('multiple errors', () => {
    it('should reject with multiple errors', async () => {
      const data = { active: 'invalid', deleted: 'invalid' };
      const errors = await validateFirstError(data, FindBrandRequestDTO);
      expect(errors).toHaveLength(2);
      expect(errors[0].constraints).toEqual({
        isEnum: ActiveMessage.INVALID,
      });
      expect(errors[1].constraints).toEqual({
        isEnum: DeletedMessage.INVALID,
      });
    });
  });
});
