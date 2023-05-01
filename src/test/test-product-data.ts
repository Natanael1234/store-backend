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

  public static buildData(quantity: number, startNumber?: number) {
    if (startNumber == null) startNumber = 1;
    const arr = Array(quantity);
    for (let i = 0, j = startNumber; i < arr.length; i++, j++) {
      arr[i] = {
        code: `00000000${j}`,
        name: `Product ${j}`,
        model: `Model ${j}`,
        price: 100,
        quantityInStock: 4,
        active: true,
        brandId: 1,
      };
    }
    return arr;
  }
}
