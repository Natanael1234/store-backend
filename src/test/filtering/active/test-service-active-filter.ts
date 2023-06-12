import { FindManyOptions } from 'typeorm';
import { PaginatedResponseDTO } from '../../../modules/system/dtos/response/pagination/pagination.response.dto';
import { ActiveFilter } from '../../../modules/system/enums/filter/active-filter/active-filter.enum';

export abstract class AbstractTestServiceActiveFilter<T> {
  abstract insertRegisters(actives: boolean[]): Promise<any>;

  abstract findRegisters(
    findManyOptions: FindManyOptions,
  ): Promise<[results: T[], count: number]>;

  abstract findViaService(queryParams?: {
    active?: ActiveFilter;
  }): Promise<PaginatedResponseDTO<T>>;

  executeTests() {
    // active
    it.each([
      { description: 'null', data: { active: null } },
      { description: 'undefined', data: { active: undefined } },
      { description: 'not defined', data: {} },
      {
        description: 'ActiveFilter.ACTIVE',
        data: { active: ActiveFilter.ACTIVE },
      },
    ])(
      'should return only inactive results when "filtering.active" is $description',
      async ({ data }) => {
        await this.insertRegisters([false, true, false]);

        const [registers] = await this.findRegisters({
          where: { active: true },
          take: 12,
        });

        const retFromService = await this.findViaService(data);

        expect(retFromService).toEqual({
          count: 1,
          page: 1,
          pageSize: 12,
          results: registers,
        });
      },
    );

    // inactive
    it('should return only inactive results when "filtering.active" is ActiveFilter.INACTIVE', async () => {
      await this.insertRegisters([false, true, false]);

      const [registers] = await this.findRegisters({
        where: { active: false },
        take: 12,
      });

      const retFromService = await this.findViaService({
        active: ActiveFilter.INACTIVE,
      });

      expect(retFromService).toEqual({
        count: 2,
        page: 1,
        pageSize: 12,
        results: registers,
      });
    });

    // active and inactive
    it('should return active and inactive results when "filtering.active" is ActiveFilter.ALL', async () => {
      await this.insertRegisters([false, true, false]);
      const [registers] = await this.findRegisters({
        where: {},
        take: 12,
      });

      const retFromService = await this.findViaService({
        active: ActiveFilter.ALL,
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
