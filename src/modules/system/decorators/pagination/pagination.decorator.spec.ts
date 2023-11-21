import { plainToInstance } from 'class-transformer';
import { PaginationConfigs } from '../../configs/pagination/pagination.configs';
import { validateFirstError } from '../../utils/validation/validation';
import { PageSize } from './page-size.decorator';
import { Page } from './page.decorator';

class PaginatedDTO {
  @Page() page: number;
  @PageSize() pageSize: number;
}

async function testAccept(data: any, expectedResult: any) {
  const dto = plainToInstance(PaginatedDTO, data);
  expect(dto).toEqual(expectedResult);
  const errors = await validateFirstError(data, PaginatedDTO);
  expect(errors).toHaveLength(0);
}

describe('Pagination decorator', () => {
  it('should be defined', () => {
    expect(Page).toBeDefined();
  });

  it('"page" and "pageSize" are minimum allowed values', async () => {
    await testAccept(
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" into default page when "page" is null', async () => {
    await testAccept(
      { page: null, pageSize: PaginationConfigs.MIN_PAGE_SIZE },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" into default page size when "pageSize" is null', async () => {
    await testAccept(
      { page: PaginationConfigs.MIN_PAGE, pageSize: null },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" and pageSize into default values when "page" and "pageSize" are null', async () => {
    await testAccept(
      { page: null, pageSize: null },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" when "page" is undefined', async () => {
    await testAccept(
      { page: undefined, pageSize: PaginationConfigs.MIN_PAGE_SIZE },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" when "page" is null', async () => {
    await testAccept(
      { page: null, pageSize: PaginationConfigs.MIN_PAGE_SIZE },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" when "pageSize" is undefined', async () => {
    await testAccept(
      { page: PaginationConfigs.MIN_PAGE, pageSize: undefined },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" and "pageSize" when "page" and "pageSize" are undefined', async () => {
    await testAccept(
      { page: undefined, pageSize: undefined },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "page" when "page" property is not defined', async () => {
    await testAccept(
      { pageSize: PaginationConfigs.MAX_PAGE_SIZE },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.MAX_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" when "pageSize" property is not defined', async () => {
    await testAccept(
      { page: PaginationConfigs.MIN_PAGE },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" when "page" and "pageSize" properties is not defined', async () => {
    await testAccept(
      {},
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should accept when "page" and "pageSize" properties are greater then minimum allowed', async () => {
    await testAccept({ page: 5, pageSize: 10 }, { page: 5, pageSize: 10 });
  });

  it('should accept and transform "page" when "page" is smaller than minimum allowed "page"', async () => {
    await testAccept(
      {
        page: PaginationConfigs.MIN_PAGE - 1,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" when "pageSize" is smaller than minimum allowed "pageSize"', async () => {
    await testAccept(
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE - 1,
      },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MIN_PAGE_SIZE,
      },
    );
  });

  it('should accept when "pageSize" has the maximum size', async () => {
    await testAccept(
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MAX_PAGE_SIZE,
      },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MAX_PAGE_SIZE,
      },
    );
  });

  it('should accept and transform "pageSize" when "pageSize" is integer greater than maximum size', async () => {
    await testAccept(
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MAX_PAGE_SIZE + 1,
      },
      {
        page: PaginationConfigs.MIN_PAGE,
        pageSize: PaginationConfigs.MAX_PAGE_SIZE,
      },
    );
  });

  it('should use default page when "page" is float', async () => {
    await testAccept(
      { page: PaginationConfigs.MIN_PAGE + 0.1 },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page when "page" is boolean', async () => {
    await testAccept(
      { page: true },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page when "page" is object', async () => {
    await testAccept(
      { page: {} },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page when "page" is array', async () => {
    await testAccept(
      { page: [] },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page when "page" is string', async () => {
    await testAccept(
      { page: `${PaginationConfigs.MIN_PAGE}` },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is float', async () => {
    await testAccept(
      { pageSize: PaginationConfigs.MIN_PAGE + 0.1 },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is float less than the minimum allowed', async () => {
    await testAccept(
      { pageSize: PaginationConfigs.MIN_PAGE_SIZE - 0.1 },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is boolean', async () => {
    await testAccept(
      { pageSize: true },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is object', async () => {
    await testAccept(
      { pageSize: {} },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is array', async () => {
    await testAccept(
      { pageSize: [] },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });

  it('should use default page size when "pageSize" is string', async () => {
    await testAccept(
      { pageSize: `${PaginationConfigs.MIN_PAGE_SIZE}` },
      {
        page: PaginationConfigs.DEFAULT_PAGE,
        pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      },
    );
  });
});
