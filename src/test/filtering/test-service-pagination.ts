import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { PaginatedResponseDTO } from '../../modules/system/dtos/response/pagination/pagination.response.dto';
import { PaginationMessage } from '../../modules/system/enums/messages/pagination-messages/pagination-messages.enum';

export abstract class TestServicePagination<T> {
  abstract insertViaRepository(quantity: number): Promise<any>;

  abstract findViaRepository(
    findManyOptions: FindManyOptions,
  ): Promise<[results: T[], count: number]>;

  abstract findViaService(pagination?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponseDTO<T>>;

  async testPagination(paginationParams?: {
    page?: number;
    pageSize?: number;
  }) {
    // prepare
    const count = 15;
    await this.insertViaRepository(count);

    let page = paginationParams?.page;
    if (page == null) page = 1;
    if (page < 1) page = 1;

    let pageSize = paginationParams?.pageSize;
    if (pageSize == null) pageSize = 12;
    if (pageSize < 1) pageSize = 1;
    if (pageSize > 40) pageSize = 40;

    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const [results] = await this.findViaRepository({ skip, take });

    // execute
    const ret = paginationParams
      ? await this.findViaService(paginationParams)
      : await this.findViaService();

    // test
    expect(ret).toEqual({ count, page, pageSize, results });
  }

  executeTests() {
    it('should paginate serch registers without sending pagination params', async () => {
      await this.testPagination(null);
    });

    it('should paginate search without sending page and page size', async () => {
      await this.testPagination({});
    });

    it('should paginate seach without sending page size', async () => {
      await this.testPagination({ page: 1 });
    });

    it('should paginate search without sending page size and sending page > 1', async () => {
      await this.testPagination({ page: 2 });
    });

    it('should paginage serch without sending page and sending page size != default page size', async () => {
      await this.testPagination({ pageSize: 5 });
    });

    it('should paginate search seding page > 1 and page size != page size', async () => {
      await this.testPagination({ page: 3, pageSize: 5 });
    });

    it('should use page=1 when page parameter = 0', async () => {
      await this.testPagination({ page: 0, pageSize: 5 });
    });

    it('should use page=1 when page parameter < 0', async () => {
      await this.testPagination({ page: -1, pageSize: 5 });
    });

    it('should use pageSize=1 when pageSize parameter = 0', async () => {
      await this.testPagination({ pageSize: 0 });
    });

    it('should use pageSize=1 when pageSize parameter = -1', async () => {
      await this.testPagination({ pageSize: -1 });
    });

    it('should use pageSize=40 when pageSize parameter = 40', async () => {
      await this.testPagination({ pageSize: 40 });
    });

    it('should use pageSize=40 when pageSize parameter > 40', async () => {
      await this.testPagination({ pageSize: 41 });
    });

    it('should fail if page is float', async () => {
      const fn = () => this.findViaService({ page: 1.1 });
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'UnprocessableEntityException',
          message: {
            page: PaginationMessage.PAGE_INT,
          },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail if page is negative float', async () => {
      const fn = () => this.findViaService({ page: -1.1 });
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'UnprocessableEntityException',
          message: {
            page: PaginationMessage.PAGE_INT,
          },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });
  }
}
