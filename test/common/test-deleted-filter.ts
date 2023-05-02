import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { DeletedFilter } from '../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../src/modules/system/enums/messages/deleted-messages/deleted-messages.enum';
import { objectToJSON } from './instance-to-json';

export abstract class AbstractTestDeletedFilter<T> {
  abstract insertRegisters(
    quantity: number,
    deletedIds: number[],
  ): Promise<any>;

  abstract findRegisters(options: {
    deleted?: boolean;
  }): Promise<[pages: T[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: {
      deleted?: any;
    },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: T[];
  }>;

  executeTests() {
    it('should return not deleted results when "deleted" parameter is not defined', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({ deleted: false });
      const ret = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return not deleted results when deleted parameter is equal to "not_deleted"', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({ deleted: false });
      const ret = await this.getPagesFromAPI(
        { deleted: DeletedFilter.NOT_DELETED },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return deleted when deleted parameter is equal to "not deleted"', async () => {
      await this.insertRegisters(
        15,
        [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
      );
      const [registers] = await this.findRegisters({ deleted: true });
      const ret = await this.getPagesFromAPI(
        { deleted: DeletedFilter.DELETED },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return both deleted and not deleted when deleted parameter is equal to "all"', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({});
      const ret = await this.getPagesFromAPI(
        { deleted: DeletedFilter.ALL },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should fail when deleted parameter is invalid', async () => {
      const ret = await this.getPagesFromAPI(
        { deleted: 'invalid' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(ret).toEqual({
        error: UnprocessableEntityException.name,
        message: { deleted: DeletedMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  }
}
