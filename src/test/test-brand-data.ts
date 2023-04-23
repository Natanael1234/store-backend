import { TestData } from './test-data';

export class TestBrandData {
  public static get dataForRepository() {
    return [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ];
  }

  static getNameErrorDataList(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getNameErrorDataList(dtoData, purpose);
  }

  static getActiveErrorDataList() {
    let dtoData = this.dataForRepository[1];
    return TestData.getActiveErrorDataList(dtoData);
  }

  static getNameAcceptableValues(purpose: 'create' | 'register' | 'update') {
    let dtoData = this.dataForRepository[1];
    return TestData.getNameAcceptableValues(dtoData, purpose);
  }

  static getActiveAcceptableValues() {
    let dtoData = this.dataForRepository[1];
    return TestData.getActiveAcceptableValues(dtoData);
  }
}
