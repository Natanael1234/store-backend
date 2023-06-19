import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { ActiveFilter } from '../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { ActiveMessage } from '../../src/modules/system/enums/messages/active-messages/active-messages.enum';
import { objectToJSON } from './instance-to-json';

export abstract class AbstractTestAPIActiveFilter<EntityType> {
  abstract insertRegisters(active: boolean[]): Promise<any>;

  abstract findRegisters(
    findManyOptions: FindManyOptions,
  ): Promise<[pages: EntityType[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: { active?: any },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: EntityType[];
  }>;

  executeTests() {
    it('should return active results when "active" parameter is not defined', async () => {
      await this.insertRegisters([
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
      ]);
      const [registers] = await this.findRegisters({
        where: { active: true },
        take: 12,
      });
      const ret = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return active results when active parameter is equal to "active"', async () => {
      await this.insertRegisters([
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
      ]);
      const [registers] = await this.findRegisters({
        where: { active: true },
        take: 12,
      });
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
      await this.insertRegisters([
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
      ]);
      const [registers] = await this.findRegisters({
        where: { active: false },
        take: 12,
      });
      const ret = await this.getPagesFromAPI(
        { active: ActiveFilter.INACTIVE },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 2,
        page: 1,
        pageSize: 12,
        results: objectToJSON(registers),
      });
    });

    it('should return both active and inactive results when active parameter is equal to "all"', async () => {
      await this.insertRegisters([
        true,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
      ]);
      const [registers] = await this.findRegisters({ take: 12 });
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
      await this.insertRegisters([true]);
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
