import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { ActiveFilter } from '../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { ActiveMessage } from '../../src/modules/system/enums/messages/active-messages/active-messages.enum';
import { objectToJSON } from './instance-to-json';

export abstract class AbstractTestActiveFilter<T> {
  abstract insertRegisters(
    quantity: number,
    inactiveIds: number[],
  ): Promise<any>;

  abstract findRegisters(options: {
    active?: boolean;
  }): Promise<[pages: T[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: { active?: any },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: T[];
  }>;

  executeTests() {
    it('should return active results when "active" parameter is not defined', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({ active: true });
      const ret = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return active results when active parameter is equal to "active"', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({ active: true });
      const ret = await this.getPagesFromAPI(
        { active: ActiveFilter.ACTIVE },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return inactive results when active parameter is equal to "inactive"', async () => {
      await this.insertRegisters(
        15,
        [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
      );
      const [registers] = await this.findRegisters({ active: false });
      const ret = await this.getPagesFromAPI(
        { active: ActiveFilter.INACTIVE },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return both active and inactive results when active parameter is equal to "all"', async () => {
      await this.insertRegisters(15, [2, 13]);
      const [registers] = await this.findRegisters({});
      const ret = await this.getPagesFromAPI(
        { active: ActiveFilter.ALL },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should fail when active parameter is invalid', async () => {
      const ret = await this.getPagesFromAPI(
        { active: 'invalid' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(ret).toEqual({
        error: UnprocessableEntityException.name,
        message: { active: ActiveMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  }
}
