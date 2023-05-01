import { TestBrandData } from '../../../../../test/test-brand-data';
import { TestPurpose } from '../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../test/test-data/test-active-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../../test/test-data/test-name-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { CreateBrandRequestDTO } from './create-brand.request.dto';

describe('CreateBrandRequestDTO', () => {
  it('should pass validation', async () => {
    const brandData = TestBrandData.dataForRepository;

    const errors = await validateFirstError(
      brandData[0],
      CreateBrandRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(
      getNameErrorDataList(
        TestBrandData.dataForRepository[1],
        TestPurpose.create,
      ),
    )(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getNameAcceptableValues(
        TestBrandData.dataForRepository[1],
        TestPurpose.create,
      ),
    )('should validate when name is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateBrandRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('active', () => {
    it.each(getActiveErrorDataList(TestBrandData.dataForRepository[1]))(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateBrandRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(getActiveAcceptableValues(TestBrandData.dataForRepository[1]))(
      'should validate when active is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateBrandRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });
});
