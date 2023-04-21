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
    let dtoData = this.dataForRepository[2];
    return TestData.getCodeErrorDataList(dtoData, purpose);
  }

  static getNameErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[2];
    return TestData.getNameErrorDataList(dtoData, purpose);
  }

  static getModelErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[2];
    return TestData.getModelErrorDataList(dtoData, purpose);
  }

  static getActiveErrorDataList() {
    let dtoData = this.dataForRepository[2];
    return TestData.getActiveErrorDataList(dtoData);
  }

  static getPriceErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[2];
    return TestData.getPriceErrorDataList(dtoData, purpose);
  }

  static getQuantityInStockErrorDataList() {
    let dtoData = this.dataForRepository[2];
    return TestData.getQuantityInStockErrorDataList(dtoData);
  }

  static getBrandIdErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[2];
    return TestData.getBrandIdErrorDataList(dtoData, purpose);
  }

  static getCodeAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getCodeAcceptableValues(dtoData);
  }

  static getNameAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getNameAcceptableValues(dtoData);
  }

  static getModelAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getModelAcceptableValues(dtoData);
  }

  static getActiveAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getActiveAcceptableValues(dtoData);
  }

  static getPriceAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getPriceAcceptableValues(dtoData);
  }

  static getQuantityInStockAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getQuantityInStockAcceptableValues(dtoData);
  }

  static getBrandIdAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getBrandIdAcceptableValues(dtoData);
  }
}
