import { plainToInstance } from 'class-transformer';
import { TestDtoSort } from '../../../../test/filtering/sort/test-dto-sort-filter';
import { validateFirstError } from '../../utils/validation';
import { Sort } from './sort.decorator';

enum TestEnum {
  A = 'a',
  B = 'b',
}

describe('Sort decorator', () => {
  it('should be defined', () => {
    expect(Sort).toBeDefined();
  });

  const options = { defaultValues: [TestEnum.A] };

  const { accepts, rejects } = new TestDtoSort(TestEnum).getTestData();

  describe('Enum = ' + JSON.stringify(TestEnum), () => {
    // accept
    describe.each(accepts)(
      'options = $options.description',
      ({ description, options, test }) => {
        describe('accepts', () => {
          it(`${description}`, async () => {
            class Clazz {
              @Sort(TestEnum, options.data) ids: TestEnum[];
            }
            const dtoData = { ids: test.data };
            const errors = await validateFirstError(dtoData, Clazz);
            expect(errors).toHaveLength(0);
            const dto = plainToInstance(Clazz, dtoData);
            expect(dto).toEqual({ ids: test.normalizedData });
          });
        });
      },
    );

    // reject
    describe.each(rejects)(
      'options = $options.description',
      ({ description, test, options, constraints }) => {
        describe('rejects', () => {
          it(description, async () => {
            const dtoData = { ids: test.data };
            class Clazz {
              @Sort(TestEnum, options.data) ids: TestEnum[];
            }
            const errors = await validateFirstError(dtoData, Clazz);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toEqual('ids');
            expect(errors[0].value).toEqual(test.normalizedData);
            expect(errors[0].constraints).toEqual(constraints);
          });
        });
      },
    );
  });
});
