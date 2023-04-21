import { TestData } from './test-data';

export class TestBrandData {
  public static get dataForRepository() {
    return [
      { name: 'Product 1', active: true },
      { name: 'Product 2', active: false },
      { name: 'Product 3' },
    ];
  }

  static getNameErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[2];
    return TestData.getNameErrorDataList(dtoData, purpose);
  }

  static getActiveErrorDataList() {
    let dtoData = this.dataForRepository[2];
    return TestData.getActiveErrorDataList(dtoData);
  }

  static getNameAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getNameAcceptableValues(dtoData);
  }

  static getActiveAcceptableValues() {
    let dtoData = this.dataForRepository[2];
    return TestData.getActiveAcceptableValues(dtoData);
  }
}
