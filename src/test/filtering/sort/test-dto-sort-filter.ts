import * as _ from 'lodash';

import { SortMessage } from '../../../modules/system/enums/messages/sort-messages/sort-messages.enum';

class Options<Enum extends Record<string, string>> {
  readonly normalizedData?: { defaultValues?: Enum[keyof Enum][] };
  readonly data?: { defaultValues?: Enum[keyof Enum][] };
  constructor(
    readonly description: string,
    data?: {
      defaultValues?: Enum[keyof Enum][];
    },
  ) {
    if (data) {
      if (!data.hasOwnProperty('defaultValues')) {
        this.data = {};
      } else {
        this.data = {
          defaultValues: data.defaultValues,
        };
        this.normalizedData = {
          defaultValues: [...new Set(data.defaultValues)],
        };
      }
    }
  }
}

class Test<Enum extends Record<string, string>> {
  normalizedData: any[];
  constructor(readonly description: string, readonly data: any) {
    if (data === null) {
      this.normalizedData = null;
    } else if (data === undefined || data === '') {
      this.normalizedData = undefined;
    } else if (typeof data == 'string') {
      this.normalizedData = [...new Set(data.split(','))];
    } else if (Array.isArray(data)) {
      this.normalizedData = [...new Set(data)];
    } else {
      this.normalizedData = data;
    }
  }
}

class OptionTest<Enum extends Record<string, string>> {
  readonly description: string;
  readonly constraints?: { isSorting: SortMessage.INVALID };

  constructor(
    enumValue: Enum,
    readonly options: Options<Enum>,
    readonly test: Test<Enum>,
  ) {
    if (
      options?.data?.defaultValues &&
      (test.normalizedData == null || test.normalizedData.length === 0)
    ) {
      test.normalizedData = options.normalizedData?.defaultValues;
    }

    if (test.normalizedData) {
      const constraints = { isSorting: SortMessage.INVALID };
      if (Array.isArray(test.normalizedData)) {
        for (let item of test.normalizedData) {
          const isValid = Object.values(enumValue).includes(item);
          if (!isValid) {
            this.constraints = constraints;
            break;
          }
        }
      } else {
        this.constraints = constraints;
      }
    }

    if (!this.constraints) {
      this.description = `should receive ${
        test.description
      } and return ${JSON.stringify(test.normalizedData)}`;
    } else {
      this.description = `should reject ${test.description} `;
    }
  }
}

class Results<Enum extends Record<string, string>> {
  readonly accepts: OptionTest<Enum>[];
  readonly rejects: OptionTest<Enum>[];
  constructor(optionsTests: OptionTest<Enum>[]) {
    this.accepts = optionsTests.filter(
      (optionsTest) => !optionsTest.constraints,
    );
    this.rejects = optionsTests.filter((optionTest) => optionTest.constraints);
  }
}

class CustomDefaults<Enum extends Record<string, string>> {
  description: string;
  values: Enum[keyof Enum][];
}
export class TestDtoSort<Enum extends Record<string, string>> {
  private readonly options: Options<Enum>[];
  constructor(
    private readonly enumeration: Enum,
    private readonly customDefaultValues?: CustomDefaults<Enum>[],
  ) {}

  getTestData() {
    const options = this.getOptions();
    const tests = this.getTests();
    const optionsTests: OptionTest<Enum>[] = [];
    for (const option of options) {
      for (const test of tests) {
        optionsTests.push(
          new OptionTest(
            this.enumeration,
            _.cloneDeep(option),
            _.cloneDeep(test),
          ),
        );
      }
    }
    const results = new Results(optionsTests);
    return results;
  }

  private getOptions(): Options<Enum>[] {
    // if received custom options
    if (this.customDefaultValues) {
      return this.customDefaultValues.map(({ description, values }) => {
        return new Options<Enum>(description, { defaultValues: values });
      });
    }
    // else use default options

    // enum values
    const enumValues = Object.values(this.enumeration) as Enum[keyof Enum][];

    const defaultOptions: Options<Enum>[] = [
      new Options<Enum>('undefined', { defaultValues: undefined }),
      new Options<Enum>('null', { defaultValues: null }),
      new Options<Enum>(JSON.stringify({ defaultValues: enumValues }), {
        defaultValues: enumValues,
      }),
      new Options<Enum>(
        JSON.stringify({ defaultValues: [enumValues[0], enumValues[0]] }),
        {
          defaultValues: [enumValues[0], enumValues[0]], // repeated value
        },
      ),
    ];

    return defaultOptions;
  }

  private getTests(): Test<Enum>[] {
    const keys = Object.keys(this.enumeration);
    const values = Object.values(this.enumeration);
    if (keys.length < 2) {
      throw new Error('Enum has no enough keys');
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];

    const tests: Test<Enum>[] = [
      new Test<Enum>('[]', []),

      ...Object.keys(this.enumeration).map((key) => {
        const value = `${this.enumeration[key]}`;
        return new Test<Enum>(`["${value}"]`, [value]);
      }),
      ...Object.keys(this.enumeration).map((key) => {
        return new Test<Enum>(`[OrderEnum.${key}]`, [this.enumeration[key]]);
      }),
      new Test<Enum>(
        `${JSON.stringify([firstValue, lastValue, lastValue])} (repeated item)`,
        [firstValue, lastValue, lastValue],
      ),
      new Test<Enum>(`"${values.join(',')}"`, values.join(',')),
      new Test<Enum>(
        `"${firstValue},${lastValue},${lastValue}" (repeated item)`,
        `${firstValue},${lastValue},${lastValue}`,
      ),
      new Test<Enum>(JSON.stringify(lastValue), lastValue),
      new Test<Enum>(JSON.stringify(''), ''),
      new Test<Enum>('invalid type', true),

      new Test<Enum>('null', null),
      new Test<Enum>('"null"', 'null'),
      new Test<Enum>('[null]', [null]),
      new Test<Enum>(`[${JSON.stringify('null')}]`, ['null']),

      new Test<Enum>(JSON.stringify('undefined'), 'undefined'),
      new Test<Enum>('undefined', undefined),
      new Test<Enum>('[undefined]', [undefined]),
      new Test<Enum>('["undefined"]', ['undefined']),

      new Test<Enum>("['invalid_impossible_and_never_gonna_happen']", [
        'invalid_impossible_and_never_gonna_happen',
      ]),
      new Test<Enum>(
        JSON.stringify('invalid_impossible_and_never_gonna_happen'),
        'invalid_impossible_and_never_gonna_happen',
      ),
      new Test<Enum>(
        JSON.stringify(
          `${lastValue},invalid_impossible_and_never_gonna_happen`,
        ),

        `${lastValue},invalid_impossible_and_never_gonna_happen`,
      ),
    ];

    return tests;
  }
}
