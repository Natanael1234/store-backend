import { HttpStatus } from '@nestjs/common';
import { objectToJSON } from './instance-to-json';

const textsToAppend = [];
for (let i = 0; i < 15; i++) {
  textsToAppend.push(i % 2 == 0 ? ' EVEN' : ' ODD');
}

export abstract class AbstractTestTextFilter<T> {
  abstract insertRegisters(textToAppend: string[]): Promise<any>;

  abstract findRegisters(options: {
    query?: string;
  }): Promise<[pages: T[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: { query?: any },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: T[];
  }>;

  executeTests() {
    it('should filter by text', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({
        query: 'EVEN',
      });
      const ret = await this.getPagesFromAPI({ query: 'EVEN' }, HttpStatus.OK);
      expect(ret).toEqual({
        count: 8,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });

    it('should filter by text with no results', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({
        query: 'NOT FOUND',
      });
      const ret = await this.getPagesFromAPI(
        { query: 'NOT FOUND' },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    it('should filter by text in empty table with no results', async () => {
      const ret = await this.getPagesFromAPI({ query: 'EVEN' }, HttpStatus.OK);
      expect(ret).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    it('should not filter by text when query is not defined', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({});
      const ret = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });

    it('should not filter by text when query is empty', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({});
      const ret = await this.getPagesFromAPI({ query: '' }, HttpStatus.OK);
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });

    it('should not filter by text when query is made only of spaces', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({});
      const ret = await this.getPagesFromAPI({ query: '    ' }, HttpStatus.OK);
      expect(ret).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });

    it('should ignore spaces', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({
        query: 'EVEN',
      });
      const ret = await this.getPagesFromAPI(
        { query: '  EV   N' },
        HttpStatus.OK,
      );
      expect(ret).toEqual({
        count: 8,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });

    it('should ignore case', async () => {
      await this.insertRegisters(textsToAppend);
      const [results, count] = await this.findRegisters({
        query: 'EVEN',
      });
      const ret = await this.getPagesFromAPI({ query: 'eVEN' }, HttpStatus.OK);
      expect(ret).toEqual({
        count: 8,
        page: 1,
        pageSize: 12,
        results: objectToJSON(results),
      });
    });
  }
}
