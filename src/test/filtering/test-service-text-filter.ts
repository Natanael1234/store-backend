import { FindManyOptions } from 'typeorm';
import { PaginatedResponseDTO } from '../../modules/system/dtos/response/pagination/pagination.response.dto';

export abstract class AbstractTestServiceTextFilter<T> {
  abstract insertViaRepository(texts: string[]): Promise<any>;

  abstract findViaRepository(
    findManyOptions: FindManyOptions,
  ): Promise<[results: T[], count: number]>;

  abstract findViaService(queryParams?: {
    query?: string;
  }): Promise<PaginatedResponseDTO<T>>;

  executeTests() {
    it('should do textual filtering matching one result', async () => {
      await this.insertViaRepository(['Testing 1', 'Testing 2', 'Testing 3']);
      const [repositoryResults] = await this.findViaRepository({
        where: { id: 1 },
      });

      const serviceResult = await this.findViaService({ query: 'inG 1' });

      expect(serviceResult).toEqual({
        count: 1,
        page: 1,
        pageSize: 12,
        results: repositoryResults,
      });
    });

    it('should do textual filtering matching all results', async () => {
      await this.insertViaRepository(['Testing 1', 'Testing 2', 'Testing 3']);
      const [repositoryResults] = await this.findViaRepository({});

      const serviceResult = await this.findViaService({ query: ' eS   ing' });

      expect(serviceResult).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: repositoryResults,
      });
    });

    it('should do textual filtering matching no results', async () => {
      await this.insertViaRepository(['Testing 1', 'Testing 2', 'Testing 3']);

      const serviceResult = await this.findViaService({
        query: '  not  found ',
      });

      expect(serviceResult).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    it('should not filter by text when query is empty string', async () => {
      await this.insertViaRepository(['Testing 1', 'Testing 2', 'Testing 3']);
      const [repositoryResults] = await this.findViaRepository({});

      const serviceResult = await this.findViaService({ query: '' });

      expect(serviceResult).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: repositoryResults,
      });
    });

    it('should not filter by text when query is string of spaces', async () => {
      await this.insertViaRepository(['Testing 1', 'Testing 2', 'Testing 3']);
      const [repositoryResults] = await this.findViaRepository({});

      const serviceResult = await this.findViaService({ query: '     ' });

      expect(serviceResult).toEqual({
        count: 3,
        page: 1,
        pageSize: 12,
        results: repositoryResults,
      });
    });
  }
}
