import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { FindManyOptions, IsNull, Not } from 'typeorm';
import { DeletedFilter } from '../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../src/modules/system/enums/messages/deleted-messages/deleted-messages.enum';
import { objectToJSON } from './instance-to-json';

export abstract class AbstractTestAPIDeletedFilter<EntityType> {
  abstract insertRegisters(deletedIds: boolean[]): Promise<any>;

  abstract findRegisters(
    findManyOptions: FindManyOptions,
  ): Promise<[pages: EntityType[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: {
      deleted?: any;
    },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: EntityType[];
  }>;

  executeTests() {
    it('should return not deleted results when "deleted" parameter is not defined', async () => {
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
      const [repositoryResults] = await this.findRegisters({ take: 12 });
      const apiResults = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(apiResults).toEqual({
        count: 2,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should return not deleted results when deleted parameter is equal to "not_deleted"', async () => {
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
      const [repositoryResults] = await this.findRegisters({ take: 12 });
      const apiResults = await this.getPagesFromAPI(
        { deleted: DeletedFilter.NOT_DELETED },
        HttpStatus.OK,
      );
      expect(apiResults).toEqual({
        count: 2,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should return deleted when deleted parameter is equal to "deleted"', async () => {
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
      const [repositoryResults] = await this.findRegisters({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        take: 12,
      });
      const apiResults = await this.getPagesFromAPI(
        { deleted: DeletedFilter.DELETED },
        HttpStatus.OK,
      );
      expect(apiResults).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should return both deleted and not deleted when deleted parameter is equal to "all"', async () => {
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
      const [repositoryResults] = await this.findRegisters({
        take: 12,
        withDeleted: true,
      });
      const apiResults = await this.getPagesFromAPI(
        { deleted: DeletedFilter.ALL },
        HttpStatus.OK,
      );
      expect(apiResults).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
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
