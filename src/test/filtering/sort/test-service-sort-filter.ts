export class TestSortScenarioBuilder<Enum extends Record<string, string>> {
  constructor(
    private readonly enumInstance: Enum,
    private readonly defaultValue: Enum[keyof Enum][],
    private readonly testType: 'api' | 'service',
  ) {}

  /** Get all test scenarios.
   * ATENÇÃO: conforme o número de popriedades da enumeração aumenta o número de testes aumenta exponencialmente.
   * USAR COM SABEDORIA.
   * De preferência no máximo 5 propriedades (327 iterações).
   */
  public generateSuccessTestScenarios(limit?: number): {
    orderBy: Enum[keyof Enum][];
    orderBySQL: any;
    description: any;
  }[] {
    const testScenarios = this.getCombinations().map(
      (enumValues: Enum[keyof Enum][]) => {
        return {
          orderBy: enumValues,
          orderBySQL: this.mapOrderByToSQL(enumValues),
          description: JSON.stringify(enumValues),
        };
      },
    );

    if (this.testType == 'service') {
      testScenarios.unshift({
        orderBy: null,
        orderBySQL: this.mapOrderByToSQL(null),
        description: 'null',
      });
    }

    testScenarios.unshift({
      orderBy: undefined,
      orderBySQL: this.mapOrderByToSQL(undefined),
      description: 'undefined',
    });

    testScenarios.unshift({
      orderBy: [],
      orderBySQL: this.mapOrderByToSQL(undefined),
      description: 'empty array',
    });

    if (testScenarios.length > 300) throw new Error('Test scenario too large'); // TODO: validar caso a caso

    if (limit) {
      return testScenarios.slice(0, limit);
    }
    return testScenarios;
  }

  private mapOrderByToSQL(orderBy: Enum[keyof Enum][]): any {
    if (!orderBy || !orderBy.length) orderBy = this.defaultValue; // default sort
    let ret: any = {};
    for (const column of orderBy) {
      const [key, value] = (column as string).split('_');
      ret[key] = value.toUpperCase();
    }
    return ret;
  }

  /** Get all variations of ordering and subsets of enum values. */
  private getCombinations(): Enum[keyof Enum][][] {
    const enumValuesArr = [
      ...Object.values(this.enumInstance),
    ] as Enum[keyof Enum][];
    const variants: Enum[keyof Enum][][] = this.getSubsets(enumValuesArr);
    const combinations: Enum[keyof Enum][][] = [];
    for (const variant of variants) {
      const permutations = this.getPermutations(variant);
      combinations.push(...permutations);
    }
    combinations.sort((a, b) => {
      let aInner = a.map((x) => (x as string).toLowerCase()).join('');
      let bInner = b.map((x) => (x as string).toLowerCase()).join('');
      return aInner.localeCompare(bInner);
    });
    return combinations;
  }

  /** Get all possible subserts of enum values. */
  private getSubsets(
    enumValuesSetArr: Enum[keyof Enum][],
  ): Enum[keyof Enum][][] {
    if (enumValuesSetArr.length === 0) {
      return [[]];
    } else {
      let first = enumValuesSetArr[0];
      let rest = enumValuesSetArr.slice(1);
      let subsets = this.getSubsets(rest);
      let subsetsWithFirst = subsets.map((subset) => [first].concat(subset));
      return subsets.concat(subsetsWithFirst);
    }
  }

  /** Get all possible ordering variations of enum values. */
  private getPermutations(
    enumValuesSetArr: Enum[keyof Enum][],
  ): Enum[keyof Enum][][] {
    if (enumValuesSetArr.length === 1) {
      return [enumValuesSetArr];
    } else {
      let result: Enum[keyof Enum][][] = [];
      for (let i = 0; i < enumValuesSetArr.length; i++) {
        let first = enumValuesSetArr[i];
        let remaining = enumValuesSetArr
          .slice(0, i)
          .concat(enumValuesSetArr.slice(i + 1));
        let innerPermutations = this.getPermutations(remaining);
        for (let j = 0; j < innerPermutations.length; j++) {
          result.push([first].concat(innerPermutations[j]));
        }
      }
      return result;
    }
  }
}
