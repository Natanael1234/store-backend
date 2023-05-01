export class TestBrandData {
  public static get dataForRepository() {
    return [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ];
  }

  public static buildData(quantity: number, startNumber?: number) {
    if (startNumber == null) startNumber = 1;
    return Array(quantity)
      .fill(null)
      .map((v, i) => {
        return { name: `Brand ${startNumber++}`, active: true };
      });
  }
}
