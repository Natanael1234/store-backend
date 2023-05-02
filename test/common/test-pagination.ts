import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { PaginationMessage } from '../../src/modules/system/enums/messages/pagination-messages/pagination-messages.enum';
import { objectToJSON } from './instance-to-json';

export abstract class AbstractTestPagination<T> {
  public abstract insertRegisters(quantity: number): Promise<any>;

  public abstract findRegisters(options: {
    take: number;
    skip: number;
  }): Promise<[pages: T[], count: number]>;

  public abstract getPagesFromAPI(
    queryParameters: {
      page?: any;
      pageSize?: any;
    },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: T[];
  }>;

  executeTests(options?: { ignoreNoRegisters }) {
    it('should return the first page with default page size when both page and pageSize are not defined', async () => {
      await this.insertRegisters(15);
      const [registers] = await this.findRegisters({
        skip: 0,
        take: 12,
      });
      const ret = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    if (!options || !options.ignoreNoRegisters) {
      it('should return empty results when there is no registers saved', async () => {
        const ret = await this.getPagesFromAPI(
          { page: 1, pageSize: 12 },
          HttpStatus.OK,
        );
        expect(ret).toEqual({
          count: 0,
          page: 1,
          pageSize: 12,
          results: [],
        });
      });
    }

    it('should return a specific page with specific size when both page and pageSize are specified', async () => {
      await this.insertRegisters(15);
      const [registers] = await this.findRegisters({
        skip: 6,
        take: 3,
      });
      const ret = await this.getPagesFromAPI(
        { page: 3, pageSize: 3 },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 15,
        page: 3,
        pageSize: 3,
        results: objectToJSON(registers),
      });
    });

    it('should return empty results when page is greater than the last page', async () => {
      await this.insertRegisters(15);
      const ret = await this.getPagesFromAPI(
        { page: 4, pageSize: 12 },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 15,
        page: 4,
        pageSize: 12,
        results: [],
      });
    });

    describe('page', () => {
      it('should return first page when page parameter is equal to the minimum allowed page', async () => {
        await this.insertRegisters(15);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 12,
        });
        const ret = await this.getPagesFromAPI({ page: 1 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 15,
          page: 1,
          pageSize: 12,
          results: objectToJSON(registers),
        });
      });

      it('should return another page when page parameter is greater than the first page', async () => {
        await this.insertRegisters(15);
        const [registers] = await this.findRegisters({
          skip: 12,
          take: 12,
        });
        const ret = await this.getPagesFromAPI({ page: 2 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 15,
          page: 2,
          pageSize: 12,
          results: objectToJSON(registers),
        });
      });

      it('should return first page when page parameter is less than the minimum allowed page', async () => {
        await this.insertRegisters(15);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 12,
        });
        const ret = await this.getPagesFromAPI({ page: 0 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 15,
          page: 1,
          pageSize: 12,
          results: objectToJSON(registers),
        });
      });

      it('should return first page when page parameter is negative', async () => {
        await this.insertRegisters(15);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 12,
        });
        const ret = await this.getPagesFromAPI({ page: -1 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 15,
          page: 1,
          pageSize: 12,
          results: objectToJSON(registers),
        });
      });

      it('should fail when page parameter is float', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: 1.1 },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });

      it('should fail when page parameter is negative float', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: -1.1 },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });

      it('should fail when page parameter is not number', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: 'invalid' },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });
    });

    describe('page size', () => {
      it('should return a page with the minimum allowed size when "pageSize" parameter is equal to the minimum allowed size', async () => {
        await this.insertRegisters(3);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 1,
        });
        const ret = await this.getPagesFromAPI({ pageSize: 1 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 3,
          page: 1,
          pageSize: 1,
          results: objectToJSON(registers),
        });
      });

      it('should return a page with the minimum allowed size when "pageSize" parameter is less than the minimum allowed size', async () => {
        await this.insertRegisters(3);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 1,
        });
        const ret = await this.getPagesFromAPI({ pageSize: 1 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 3,
          page: 1,
          pageSize: 1,
          results: objectToJSON(registers),
        });
      });

      it('should return a page with the minimum allowed size when "pageSize" parameter is negative', async () => {
        await this.insertRegisters(3);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 1,
        });
        const ret = await this.getPagesFromAPI({ pageSize: -1 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 3,
          page: 1,
          pageSize: 1,
          results: objectToJSON(registers),
        });
      });

      it('should return a page with the maximum allowed size when "pageSize" parameter is equal to the maximum allowed size', async () => {
        await this.insertRegisters(41);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 40,
        });
        const ret = await this.getPagesFromAPI({ pageSize: 40 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 41,
          page: 1,
          pageSize: 40,
          results: objectToJSON(registers),
        });
      });

      it('should return a page with the maximum allowed size when "pageSize" parameter is greater than the maximum allowed size', async () => {
        await this.insertRegisters(41);
        const [registers] = await this.findRegisters({
          skip: 0,
          take: 40,
        });
        const ret = await this.getPagesFromAPI({ pageSize: 41 }, HttpStatus.OK);
        expect(ret).toEqual({
          count: 41,
          page: 1,
          pageSize: 40,
          results: objectToJSON(registers),
        });
      });

      it('should fail when "pageSize" parameter is float', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: 1.1 },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });

      it('should fail when "pageSize" parameter is negative float', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: -1.1 },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });

      it('should fail when "pageSize" parameter is not a number', async () => {
        await this.insertRegisters(1);
        const ret = await this.getPagesFromAPI(
          { page: 'invalid' },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
        expect(ret).toEqual({
          error: UnprocessableEntityException.name,
          message: { page: PaginationMessage.PAGE_INT },
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      });
    });
  }
}
