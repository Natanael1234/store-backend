import { plainToInstance } from 'class-transformer';
import { TestDtoTextFilter } from '../../../../test/filtering/text/text-dto-text-filter';
import { validateFirstError } from '../../utils/validation';
import { TextQuery } from './text-query.decorator';

describe('TextQuery decorator', () => {
  it('should be defined', () => {
    expect(TextQuery).toBeDefined();
  });

  const textFilter = new TestDtoTextFilter();

  it.each(textFilter.acceptData)(
    '$description',
    async ({ data, expectedData }) => {
      class Clazz {
        @TextQuery() query: string;
      }
      const dtoData = { query: data };
      const dto = plainToInstance(Clazz, dtoData);
      expect(dto).toEqual({ query: expectedData });
      const errors = await validateFirstError(dtoData, Clazz);
      expect(errors).toHaveLength(0);
    },
  );

  it.each(textFilter.errorData)(
    'should fail when $description',
    async ({ data, constraints }) => {
      class Clazz {
        @TextQuery() query: string;
      }
      const dtoData = { query: data };
      const errors = await validateFirstError(dtoData, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual(constraints);
    },
  );
});
