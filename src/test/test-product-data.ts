import { TestData } from './test-data';

export class TestProductData {
  public static get dataForRepository() {
    return [
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: 1,
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: 1,
      },
      {
        code: '00000003',
        name: 'Product 3',
        model: 'Model 3',
        price: 20,
        brandId: 2,
      },
    ];
  }

  static getCodeErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getCodeErrorDataList(dtoData, purpose);
  }

  static getNameErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getNameErrorDataList(dtoData, purpose);
  }

  static getModelErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getModelErrorDataList(dtoData, purpose);
  }

  static getActiveErrorDataList() {
    let dtoData = this.dataForRepository[1];
    return TestData.getActiveErrorDataList(dtoData);
  }

  static getPriceErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getPriceErrorDataList(dtoData, purpose);
  }

  static getQuantityInStockErrorDataList() {
    let dtoData = this.dataForRepository[1];
    return TestData.getQuantityInStockErrorDataList(dtoData);
  }

  static getBrandIdErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getBrandIdErrorDataList(dtoData, purpose);
  }

  static getCodeAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getCodeAcceptableValues(dtoData, purpose);
  }

  static getNameAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getNameAcceptableValues(dtoData, purpose);
  }

  static getModelAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getModelAcceptableValues(dtoData, purpose);
  }

  static getActiveAcceptableValues() {
    let dtoData = this.dataForRepository[1];
    return TestData.getActiveAcceptableValues(dtoData);
  }

  static getPriceAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getPriceAcceptableValues(dtoData, purpose);
  }

  static getQuantityInStockAcceptableValues(
    purpose: 'create' | 'register' | 'update',
  ) {
    let dtoData = this.dataForRepository[1];
    return TestData.getQuantityInStockAcceptableValues(dtoData, purpose);
  }

  static getBrandIdAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getBrandIdAcceptableValues(dtoData, purpose);
  }
}
