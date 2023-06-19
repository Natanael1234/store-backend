import { HttpStatus } from '@nestjs/common';
import { SortMessage } from '../../../modules/system/enums/messages/sort-messages/sort-messages.enum';
import { getCombinations } from '../../utils/test-array-combinations';

type Test<Enum extends Record<string, string>> = {
  orderBy: any;
  normalizedOrderBy?: Enum[keyof Enum][] | string | null | undefined | any;
  orderBySQL?: any;
  description?: any;
  constraints?: any;
  expectedErrorResult?: {
    error: string;
    message: any;
    statusCode: number;
  };
};

export class TestSortScenarioBuilder<Enum extends Record<string, string>> {
  constructor(
    private readonly enumInstance: Enum,
    private readonly defaultValues: Enum[keyof Enum][],
    private readonly testPurpose: 'api' | 'service',
  ) {}

  /** Get all test scenarios.
   * ATENÇÃO: conforme o número de popriedades da enumeração aumenta o número de testes aumenta exponencialmente.
   * USAR COM SABEDORIA.
   * De preferência no máximo 5 propriedades (327 iterações).
   */
  public getTests(limit?: number): {
    accepts: Test<Enum>[];
    rejects: Test<Enum>[];
  } {
    const valuesArr = [
      ...Object.values(this.enumInstance),
    ] as Enum[keyof Enum][];

    const unprocessableResult = {
      error: 'UnprocessableEntityException',
      message: { orderBy: SortMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    };
    const unprocessableConstraints = { orderBy: SortMessage.INVALID };
    const combinations = getCombinations(valuesArr);

    let testScenarios: Test<Enum>[] = combinations.map(
      (enumValues: Enum[keyof Enum][]) => {
        return {
          orderBy: enumValues,
          orderBySQL: this.mapOrderByToSQL(enumValues),
          description: JSON.stringify(enumValues),
        };
      },
    );

    testScenarios.unshift(
      {
        orderBy: ['null'],
        constraints: unprocessableConstraints,
        expectedErrorResult: unprocessableResult,
      },
      {
        orderBy: ['undefined'],
        constraints: unprocessableConstraints,
        expectedErrorResult: unprocessableResult,
      },
      {
        orderBy: ['invalid_order_by'],
        constraints: unprocessableConstraints,
        expectedErrorResult: unprocessableResult,
      },
    );

    // query parameters
    let queryParamTestScenarios = testScenarios.map((t) => {
      const orderBy = this.encodeIntoQueryParams(t.orderBy);
      return {
        orderBy,
        constraints: t.constraints,
        expectedErrorResult: t.expectedErrorResult,
      };
    });

    testScenarios.unshift(
      { orderBy: null },
      { orderBy: undefined },
      { orderBy: '' },
    );

    if (this.testPurpose == 'api') {
      testScenarios = queryParamTestScenarios;
    } else {
      testScenarios.push(...queryParamTestScenarios);
    }

    for (const scenario of testScenarios) {
      scenario.description = this.getDescription(scenario.orderBy);
      scenario.normalizedOrderBy = this.getNormalizedOrderBy(scenario.orderBy);
      scenario.orderBySQL = this.mapOrderByToSQL(scenario.normalizedOrderBy);
    }

    // max amount of tests
    if (testScenarios.length > 300) throw new Error('Test scenario too large'); // TODO: validar caso a caso
    if (limit) {
      testScenarios = testScenarios.slice(0, limit);
    }

    return {
      accepts: testScenarios.filter((t) => !t.constraints),
      rejects: testScenarios.filter((t) => t.constraints),
    };
  }

  private encodeIntoQueryParams(orderBy: any) {
    if (orderBy === undefined) {
    } else if (orderBy === null) {
      return 'null';
    }
    if (orderBy === undefined || orderBy === null || orderBy === '') {
      return '';
    } else if (Array.isArray(orderBy)) {
      return orderBy.join(',');
    } else {
      return JSON.stringify(orderBy);
    }
  }

  private getDescription(orderBy: any): string {
    if (orderBy === undefined) {
      return JSON.stringify('undefined');
    } else if (Array.isArray(orderBy)) {
      return JSON.stringify(
        orderBy.map((d) => {
          if (d === undefined) {
            return 'undefined';
          } else if (d === null) {
            return 'null';
          } else {
            return d;
          }
        }),
      );
    } else if (typeof orderBy == 'string') {
      const description = `"${orderBy}"`;
      return description;
    } else {
      const description = JSON.stringify(orderBy);
      return description;
    }
  }

  private getNormalizedOrderBy(orderBy: any) {
    const defaultValues = this.getDefaultValues();
    if (
      (orderBy == '' || orderBy === null || orderBy === undefined) &&
      defaultValues
    ) {
      return defaultValues;
    } else if (Array.isArray(orderBy)) {
      if (orderBy.length == 0 && defaultValues) {
        return defaultValues;
      }
      return orderBy;
    } else if (typeof orderBy == 'string') {
      return [...new Set(orderBy.split(','))];
    } else {
      return orderBy;
    }
  }

  private mapOrderByToSQL(normalizedData: any): any {
    const normalizedOrderBy = this.getNormalizedOrderBy(normalizedData);
    if (Array.isArray(normalizedOrderBy)) {
      let orderBySQL: any = {};
      for (const column of normalizedOrderBy) {
        const [key, value] = (column as string).split('_');
        if (value == null) {
          return;
        }
        orderBySQL[key] = value.toUpperCase();
      }
      return orderBySQL;
    }
  }

  private getDefaultValues() {
    if (this.defaultValues) {
      return [...new Set(this.defaultValues)];
    }
  }
}
