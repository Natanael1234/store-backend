import { v4 as uuidv4 } from 'uuid';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { NumberMessage } from '../../../../system/messages/number/number.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { ProductConfigs } from '../../configs/product/product.configs';
import { UpdateProductRequestDTO } from './update-product.request.dto';

const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});
const QuantityInStockMessage = new NumberMessage('quantity in stock', {
  min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
  max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
});
const CategoryIdMessage = new UuidMessage('category id');
const BrandIdMessage = new UuidMessage('brand id');

async function testAccept(data: {
  code?: string;
  name?: string;
  model?: string;
  price?: number;
  quantityInStock?: number;
  active?: boolean;
  brandId?: string;
  categoryId?: string;
}) {
  const errors = await validateFirstError(data, UpdateProductRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(
  property: string,
  data: {
    code?: string;
    name?: string;
    model?: string;
    price?: number;
    quantityInStock?: number;
    active?: boolean;
    brandId?: string;
    categoryId?: string;
  },
  expectedErrors,
) {
  const errors = await validateFirstError(data, UpdateProductRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('UpdateProductRequestDTO', () => {
  it('should pass validation', async () => {
    const errors = await validateFirstError(
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      },
      UpdateProductRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('code', () => {
    const Message = new TextMessage('code', {
      minLength: ProductConfigs.CODE_MIN_LENGTH,
      maxLength: ProductConfigs.CODE_MAX_LENGTH,
    });

    it('Should accept when code has min length', async () => {
      await testAccept({
        code: 'x'.repeat(ProductConfigs.CODE_MIN_LENGTH),
        active: true,
      });
    });

    it('Should accept when code has max length', async () => {
      await testAccept({
        code: 'x'.repeat(ProductConfigs.CODE_MAX_LENGTH),
        active: true,
      });
    });

    it('should accept when code is undefined', async () => {
      await testAccept({ code: undefined, active: true });
    });

    it('should reject when code is number', async () => {
      await testReject(
        'code',
        { code: 2323232 as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when code is boolean', async () => {
      await testReject(
        'code',
        { code: true as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when code is array', async () => {
      await testReject(
        'code',
        { code: [] as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when code is object', async () => {
      await testReject(
        'code',
        { code: {} as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when code is empty', async () => {
      await testReject(
        'code',
        { code: '', active: true },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when code is too short', async () => {
      await testReject(
        'code',
        { code: 'x'.repeat(ProductConfigs.CODE_MIN_LENGTH - 1), active: true },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when code is too long', async () => {
      await testReject(
        'code',
        { code: 'x'.repeat(ProductConfigs.CODE_MAX_LENGTH + 1), active: true },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when code is null', async () => {
      await testReject(
        'code',
        { code: null, active: true },
        { isText: Message.NULL },
      );
    });
  });

  describe('name', () => {
    const Message = new TextMessage('name', {
      minLength: ProductConfigs.NAME_MIN_LENGTH,
      maxLength: ProductConfigs.NAME_MAX_LENGTH,
    });

    it('Should accept when name has min length', async () => {
      await testAccept({
        name: 'x'.repeat(ProductConfigs.NAME_MIN_LENGTH),
        active: true,
      });
    });

    it('Should accept when name has max length', async () => {
      await testAccept({
        name: 'x'.repeat(ProductConfigs.NAME_MAX_LENGTH),
        active: true,
      });
    });

    it('should accept when name is undefined', async () => {
      await testAccept({ name: undefined, active: true });
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        { name: 2323232 as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject(
        'name',
        { name: true as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is array', async () => {
      await testReject(
        'name',
        { name: [] as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is object', async () => {
      await testReject(
        'name',
        { name: {} as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is empty', async () => {
      await testReject(
        'name',
        { name: '', active: true },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when name is too short', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(ProductConfigs.NAME_MIN_LENGTH - 1), active: true },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(ProductConfigs.NAME_MAX_LENGTH + 1), active: true },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject(
        'name',
        { name: null, active: true },
        { isText: Message.NULL },
      );
    });
  });

  describe('model', () => {
    const Message = new TextMessage('model', {
      minLength: ProductConfigs.MODEL_MIN_LENGTH,
      maxLength: ProductConfigs.MODEL_MAX_LENGTH,
    });

    it('Should accept when model has min length', async () => {
      await testAccept({
        model: 'x'.repeat(ProductConfigs.MODEL_MIN_LENGTH),
        active: true,
      });
    });

    it('Should accept when model has max length', async () => {
      await testAccept({
        model: 'x'.repeat(ProductConfigs.MODEL_MAX_LENGTH),
        active: true,
      });
    });

    it('should accept when model is undefined', async () => {
      await testAccept({ model: undefined, active: true });
    });

    it('should reject when model is number', async () => {
      await testReject(
        'model',
        { model: 2323232 as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when model is boolean', async () => {
      await testReject(
        'model',
        { model: true as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when model is array', async () => {
      await testReject(
        'model',
        { model: [] as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when model is object', async () => {
      await testReject(
        'model',
        { model: {} as unknown as string, active: true },
        { isText: Message.INVALID },
      );
    });

    it('should reject when model is empty', async () => {
      await testReject(
        'model',
        { model: '', active: true },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when model is too short', async () => {
      await testReject(
        'model',
        {
          model: 'x'.repeat(ProductConfigs.MODEL_MIN_LENGTH - 1),
          active: true,
        },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when model is too long', async () => {
      await testReject(
        'model',
        {
          model: 'x'.repeat(ProductConfigs.MODEL_MAX_LENGTH + 1),
          active: true,
        },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when model is null', async () => {
      await testReject(
        'model',
        { model: null, active: true },
        { isText: Message.NULL },
      );
    });
  });

  describe('price', () => {
    it('should validate when price is int', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when price is float', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 10.51,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when price has minimum allowed value', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: ProductConfigs.MIN_PRICE,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when price has a high value', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: ProductConfigs.MAX_PRICE,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when price is undefined', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: undefined,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should reject when price is lower than allowed', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: ProductConfigs.MIN_PRICE - 1,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.MIN },
      );
    });

    it('should reject when price is higher than allowed', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: ProductConfigs.MAX_PRICE + 1,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.MAX },
      );
    });

    it('should reject when price is null', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: null,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.NULL },
      );
    });

    it('should reject when price is boolean', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: true as unknown as number,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.INVALID },
      );
    });

    it('should reject when price is string', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: '200' as unknown as number,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.INVALID },
      );
    });

    it('should reject when price is array', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: [] as unknown as number,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.INVALID },
      );
    });

    it('should reject when price is object', async () => {
      await testReject(
        'price',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: {} as unknown as number,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: PriceMessage.INVALID },
      );
    });
  });

  describe('quantityInStock', () => {
    it('should validate when quantityInStock is int', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when quantityInStock has minimum allowed value', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when quantityInStock has a high value', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK + 1000000,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when quantityInStock is undefined', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: undefined,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should reject when quantityInStock is lower than allowed', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 10.05,
          quantityInStock: ProductConfigs.MIN_QUANTITY_IN_STOCK - 1,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.MIN },
      );
    });

    it('should reject when quantityInStock is higher than allowed', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: ProductConfigs.MAX_QUANTITY_IN_STOCK + 1,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.MAX },
      );
    });

    it('should reject when quantityInStock is null', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: null,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.NULL },
      );
    });

    it('should reject when quantityInStock is boolean', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: true as unknown as number,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.INVALID },
      );
    });

    it('should reject when quantityInStock is string', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: '4' as unknown as number,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.INVALID },
      );
    });

    it('should reject when quantityInStock is array', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: [] as unknown as number,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.INVALID },
      );
    });

    it('should reject when quantityInStock is object', async () => {
      await testReject(
        'quantityInStock',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: {} as unknown as number,
          active: false,
          brandId: uuidv4(),
          categoryId: uuidv4(),
        },
        { isNum: QuantityInStockMessage.INVALID },
      );
    });
  });

  describe('active', () => {
    const Messages = new BoolMessage('active');

    it('should accept when active is true', async () => {
      await testAccept({ active: true });
    });

    it('should accept when active is false', async () => {
      await testAccept({ active: false });
    });

    it('should accept when active is undefined', async () => {
      await testAccept({ active: undefined });
    });

    it('should reject when active is null', async () => {
      await testReject('active', { active: null }, { isBool: Messages.NULL });
    });

    it('should reject when active is number', async () => {
      await testReject(
        'active',
        { active: 1 as unknown as boolean },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        { active: 'true' as unknown as boolean },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        'active',
        { active: [] as unknown as boolean },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        'active',
        { active: {} as unknown as boolean },
        { isBool: Messages.INVALID },
      );
    });
  });

  describe('brandId', () => {
    it('should validate when brandId is valid', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when brandId is undefined', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: undefined,
        categoryId: uuidv4(),
      });
    });

    it('should reject when brandId is null', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: null,
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.NULL },
      );
    });

    it('should reject when brandId is number', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: 1 as unknown as string,
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.STRING },
      );
    });

    it('should reject when brandId is boolean', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: true as unknown as string,
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.STRING },
      );
    });

    it('should reject when brandId is invalid string', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: 'not-a-valid-uuid',
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.INVALID },
      );
    });

    it('should reject when brandId is array', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: [] as unknown as string,
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.STRING },
      );
    });

    it('should reject when brandId is object', async () => {
      await testReject(
        'brandId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: {} as unknown as string,
          categoryId: uuidv4(),
        },
        { isUuid: BrandIdMessage.STRING },
      );
    });
  });

  describe('categoryId', () => {
    it('should validate when categoryId is valid', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: uuidv4(),
      });
    });

    it('should validate when categoryId is undefined', async () => {
      await testAccept({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: uuidv4(),
        categoryId: undefined,
      });
    });

    it('should reject when categoryId is null', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: null,
        },
        { isUuid: CategoryIdMessage.NULL },
      );
    });

    it('should reject when categoryId is number', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: 1 as unknown as string,
        },
        { isUuid: CategoryIdMessage.STRING },
      );
    });

    it('should reject when categoryId is boolean', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: true as unknown as string,
        },
        { isUuid: CategoryIdMessage.STRING },
      );
    });

    it('should reject when categoryId is invalid string', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: 'not-a-valid-uuid',
        },
        { isUuid: CategoryIdMessage.INVALID },
      );
    });

    it('should reject when categoryId is array', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: [] as unknown as string,
        },
        { isUuid: CategoryIdMessage.STRING },
      );
    });

    it('should reject when categoryId is object', async () => {
      await testReject(
        'categoryId',
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: uuidv4(),
          categoryId: {} as unknown as string,
        },
        { isUuid: CategoryIdMessage.STRING },
      );
    });
  });
});
