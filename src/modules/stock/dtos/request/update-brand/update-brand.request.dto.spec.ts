import { TestBrandData } from '../../../../../test/test-brand-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { UpdateBrandRequestDTO } from './update-brand.request.dto';

describe('UpdateBrandRequestDTO', () => {
  it('should pass validation', async () => {
    const brandData = TestBrandData.dataForRepository;

    const errors = await validateFirstError(
      brandData[0],
      UpdateBrandRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(TestBrandData.getNameErrorDataList('update'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestBrandData.getNameAcceptableValues())(
      'should validate when name is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('active', () => {
    it.each(TestBrandData.getActiveErrorDataList())(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestBrandData.getActiveAcceptableValues())(
      'should validate when active is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });
});