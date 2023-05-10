import { plainToInstance } from 'class-transformer';
import { PaginationConfig } from '../../../../system/dtos/request/pagination/configs/pagination.config';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { SortMessage } from '../../../../system/enums/messages/sort-messages/sort-messages.enum';
import { TextMessage } from '../../../../system/enums/messages/text-messages/text-messages.enum';
import { validateFirstError } from '../../../../system/utils/validation';

import { TestDtoActiveFilter } from '../../../../../test/filtering/active/test-dto-active-filter';
import { TestDtoDeletedFilter } from '../../../../../test/filtering/deleted/test-dto-deleted-filter';
import { TestDtoPagination } from '../../../../../test/filtering/pagination/test-dto-pagination-filter';
import { TestDtoSort } from '../../../../../test/filtering/sort/test-dto-sort-filter';
import { TestDtoTextFilter } from '../../../../../test/filtering/text/text-dto-text-filter';
import { UserOrder } from '../../../enums/sort/user-order/user-order.enum';
import { FindUserRequestDTO } from './find-users.request.dto';

const defaultDtoResult = {
  query: undefined,
  active: ActiveFilter.ACTIVE,
  deleted: DeletedFilter.NOT_DELETED,
  page: PaginationConfig.DEFAULT_PAGE,
  pageSize: PaginationConfig.DEFAULT_PAGE_SIZE,
  orderBy: [UserOrder.NAME_ASC],
};

async function testAccepts(data: any, expectedResult: any) {
  const dto = plainToInstance(FindUserRequestDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, FindUserRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testErrors(data: any, constraints: { [type: string]: string }) {
  const errors = await validateFirstError(data, FindUserRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('FindUserRequestDTO', () => {
  it('sould validate', async () => {
    const data = {
      query: 'test',
      active: 'all',
      deleted: 'not_deleted',
      page: 2,
      pageSize: 4,
      orderBy: ['name_desc', 'active_asc'],
    };
    const dto = plainToInstance(FindUserRequestDTO, data);
    expect(dto).toEqual({
      query: 'test',
      active: ActiveFilter.ALL,
      deleted: DeletedFilter.NOT_DELETED,
      page: 2,
      pageSize: 4,
      orderBy: [UserOrder.NAME_DESC, UserOrder.ACTIVE_ASC],
    });
    const errors = await validateFirstError(data, FindUserRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('query', () => {
    const textFilter = new TestDtoTextFilter(defaultDtoResult);

    it.each(textFilter.acceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        const dto = plainToInstance(FindUserRequestDTO, data);
        expect(dto).toEqual(expectedResult);
        const errors = await validateFirstError(data, FindUserRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );

    it.each(textFilter.errorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        const errors = await validateFirstError(data, FindUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(constraints);
      },
    );
  });

  describe('active', () => {
    const testActive = new TestDtoActiveFilter(defaultDtoResult);

    it.each(testActive.acceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        await testAccepts(data, expectedResult);
      },
    );

    it.each(testActive.errorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        await testErrors(data, constraints);
      },
    );
  });

  describe('deleted', () => {
    const testDeleted = new TestDtoDeletedFilter(defaultDtoResult);

    it.each(testDeleted.acceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        await testAccepts(data, expectedResult);
      },
    );

    it.each(testDeleted.errorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        await testErrors(data, constraints);
      },
    );
  });

  describe('pagination', () => {
    const testPagination = new TestDtoPagination(defaultDtoResult);

    it.each(testPagination.acceptData)(
      '$description',
      async ({ data, expectedResult }) => {
        await testAccepts(data, expectedResult);
      },
    );

    it.each(testPagination.errorData)(
      'should fail when $description',
      async ({ data, constraints }) => {
        await testErrors(data, constraints);
      },
    );
  });

  describe('sort', () => {
    const testSort = new TestDtoSort(defaultDtoResult, UserOrder, [
      UserOrder.NAME_ASC,
    ]);

    it.each(testSort.acceptData)(
      '$description',
      async ({ data, expectedResult, description }) => {
        await testAccepts(data, expectedResult);
      },
    );

    it.each(testSort.errorData)(
      '$description',
      async ({ data, constraints }) => {
        await testErrors(data, constraints);
      },
    );
  });

  describe('multiple errors', () => {
    it('should fail with multiple errors', async () => {
      const data = {
        query: true,
        active: 'invalid',
        deleted: 'invalid',
        page: '-1.5',
        pageSize: 'invalid',
        orderBy: ['invalid'],
      };

      const errors = await validateFirstError(data, FindUserRequestDTO);
      expect(errors).toHaveLength(6);
      expect(errors[0].constraints).toEqual({
        isString: TextMessage.STRING,
      });
      expect(errors[1].constraints).toEqual({
        isEnum: ActiveMessage.INVALID,
      });
      expect(errors[2].constraints).toEqual({
        isEnum: DeletedMessage.INVALID,
      });
      expect(errors[3].constraints).toEqual({
        isInt: PaginationMessage.PAGE_INT,
      });
      expect(errors[4].constraints).toEqual({
        isInt: PaginationMessage.PAGE_SIZE_INT,
      });
      expect(errors[5].constraints).toEqual({
        isEnum: SortMessage.INVALID,
      });
    });
  });
});