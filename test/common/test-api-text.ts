import { HttpStatus } from '@nestjs/common';
import { In } from 'typeorm';
import { objectToJSON } from './instance-to-json';

const evenIds = [];
const oddIds = [];
const textsToAppend = [];
for (let i = 0; i < 15; i++) {
  const isEven = i % 2 == 0;
  textsToAppend.push('Test ' + (isEven ? ' EVEN' : ' ODD'));
  if (isEven) {
    evenIds.push(i + 1);
  } else {
    oddIds.push(i + 1);
  }
}

export abstract class AbstractTestAPITextFilter<T> {
  abstract insertRegisters(textToAppend: string[]): Promise<any>;

  abstract findRegisters(findManyOptions): Promise<[pages: T[], count: number]>;

  abstract getPagesFromAPI(
    queryParameters: { query?: any },
    httpStatus: number,
  ): Promise<{
    count: number;
    page: number;
    pageSize: number;
    results: T[];
  }>;

  executeTests(options?: { ignoreNoRegisters }) {
    it('should filter by text', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({
        where: { id: In(evenIds) },
        take: 12,
      });
      const apiResult = await this.getPagesFromAPI(
        { query: 'EVEN' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 8,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should filter by text with no results', async () => {
      await this.insertRegisters(textsToAppend);
      const apiResult = await this.getPagesFromAPI(
        { query: 'NOT FOUND' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 0,
        page: 1,
        pageSize: 12,
        results: [],
      });
    });

    if (!options || !options.ignoreNoRegisters) {
      it('should filter by text in empty table with no results', async () => {
        const apiResult = await this.getPagesFromAPI(
          { query: 'EVEN' },
          HttpStatus.OK,
        );
        expect(apiResult).toEqual({
          count: 0,
          page: 1,
          pageSize: 12,
          results: [],
        });
      });
    }

    it('should not filter by text when query is not defined', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({ take: 12 });
      const apiResult = await this.getPagesFromAPI({}, HttpStatus.OK);
      expect(apiResult).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should not filter by text when query is empty', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({ take: 12 });
      const apiResult = await this.getPagesFromAPI(
        { query: '' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should not filter by text when query is made only of spaces', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({ take: 12 });
      const apiResult = await this.getPagesFromAPI(
        { query: '    ' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 15,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should ignore spaces', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({
        where: { id: In(evenIds) },
        take: 12,
      });
      const apiResult = await this.getPagesFromAPI(
        { query: '  EV   N' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 8,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });

    it('should ignore case', async () => {
      await this.insertRegisters(textsToAppend);
      const [repositoryResults] = await this.findRegisters({
        where: { id: In(oddIds) },
        take: 12,
      });
      const apiResult = await this.getPagesFromAPI(
        { query: 'oDD' },
        HttpStatus.OK,
      );
      expect(apiResult).toEqual({
        count: 7,
        page: 1,
        pageSize: 12,
        results: objectToJSON(repositoryResults),
      });
    });
  }
}
