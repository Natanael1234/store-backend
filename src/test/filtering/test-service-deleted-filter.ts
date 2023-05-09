import { FindManyOptions, IsNull, Not } from 'typeorm';
import { PaginatedResponseDTO } from '../../modules/system/dtos/response/pagination/pagination.response.dto';
import { DeletedFilter } from '../../modules/system/enums/filter/deleted-filter/deleted-filter.enum';

export abstract class AbstractTestServiceDeletedFilter<T> {
  abstract insertRegisters(deleted: boolean[]): Promise<any>;

  abstract findRegisters(
    fndManyOptions: FindManyOptions,
  ): Promise<[results: T[], count: number]>;

  abstract findViaService(queryParams?: {
    deleted?: DeletedFilter;
  }): Promise<PaginatedResponseDTO<T>>;

  executeTests() {
    // deleted
    it('should return only not deleted results when "filtering.deleted" is DeletedFilter.DELETED', async () => {
      await this.insertRegisters([false, true, false]);

      const [registers] = await this.findRegisters({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        take: 12,
      });

      const retFromService = await this.findViaService({
        deleted: DeletedFilter.DELETED,
      });

      expect(retFromService).toEqual({
        count: 1,
        page: 1,
        pageSize: 12,
        results: registers,
      });
    });

    // not deleted
    it.each([
      { description: 'null', data: { deleted: null } },
      { description: 'undefined', data: { deleted: undefined } },
      { description: 'not defined', data: {} },
      {
        description: 'DeletedFilter.NOT_DELETED',
        data: { deleted: DeletedFilter.NOT_DELETED },
      },
    ])(
      'should return only not deleted results when "filtering.deleted" is $description',
      async ({ data }) => {
        await this.insertRegisters([false, true, false]);

        const [registers] = await this.findRegisters({
          take: 12,
        });

        const retFromService = await this.findViaService(data);

        expect(retFromService).toEqual({
          count: 2,
          page: 1,
          pageSize: 12,
          results: registers,
        });
      },
    );

    // deleted and not deleted
    it('should return deleted and not deleted results when "filtering.deleted" is DeletedFilter.ALL', async () => {
      await this.insertRegisters([false, true, false]);
      const [registers] = await this.findRegisters({
        withDeleted: true,
        take: 12,
      });

      const retFromService = await this.findViaService({
        deleted: DeletedFilter.ALL,
      });

      expect(retFromService).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: registers,
      });
    });
  }
}
