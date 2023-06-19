import { plainToInstance } from 'class-transformer';
import { TestDtoPagination } from '../../../../test/filtering/pagination/test-dto-pagination-filter';
import { validateFirstError } from '../../utils/validation';
import { PageSize } from './page-size.decorator';
import { Page } from './page.decorator';

class PaginatedDTO {
  @Page() page: number;
  @PageSize() pageSize: number;
}

async function testAccepts(data: any, expectedResult: any) {
  const dto = plainToInstance(PaginatedDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, PaginatedDTO);
  expect(errors).toHaveLength(0);
}

async function testErrors(data: any, constraints: { [type: string]: string }) {
  const errors = await validateFirstError(data, PaginatedDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('Page decorator', () => {
  it('should be defined', () => {
    expect(Page).toBeDefined();
  });

  const testPagination = new TestDtoPagination({});

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
