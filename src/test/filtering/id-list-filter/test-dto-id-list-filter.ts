class Options {
  public normalizedData: {
    allowNull?: boolean;
    allowUndefined?: boolean;
    allowNullItem?: boolean;
  };

  constructor(
    public readonly description: string,
    public readonly data: {
      allowNull?: boolean;
      allowUndefined?: boolean;
      allowNullItem?: boolean;
    },
  ) {
    this.normalizedData = {
      allowNull: !!this.data.allowNull,
      allowUndefined: !!this.data.allowUndefined,
      allowNullItem: !!this.data.allowNullItem,
    };
  }
}

class Test {
  public readonly normalizedData: any;

  constructor(public readonly description: string, public readonly data) {
    this.normalizedData = this.getNormalizedData();
  }

  private getNormalizedData() {
    if (this.data === '') {
      return undefined;
    } else if (typeof this.data == 'string') {
      const arr = this.data.split(',').map((e) => {
        if (e === 'null') {
          return null;
        }
        const num = Number(e);
        if (!isNaN(num)) {
          return num;
        }
        return e;
      });
      return [...new Set(arr)];
    } else if (Array.isArray(this.data)) {
      return [...new Set(this.data)];
    } else {
      return this.data;
    }
  }
}

class OptionTest {
  public readonly constraints: any;
  public readonly description: string;
  public readonly valid: boolean;
  public message: string;
  constructor(
    public readonly options: Options,
    public readonly test: Test,
    public readonly messages: Messages,
  ) {
    this.message = this.getMessage();
    this.constraints = this.getConstraints();
    this.description = this.setDescription(!this.constraints);
    this.valid = !this.constraints;
  }

  private getConstraints() {
    const message = this.getMessage();
    if (message) {
      return {
        isIdList: message,
      };
    } else {
      return null;
    }
  }

  private getMessage(): string {
    if (
      this.test.normalizedData === undefined &&
      !this.options?.normalizedData.allowUndefined
    ) {
      return this.messages.requiredMessage;
    } else if (
      this.test.normalizedData === null &&
      !this.options?.normalizedData.allowNull
    ) {
      return this.messages.notNullMessage;
    } else if (this.test.normalizedData != null) {
      if (!Array.isArray(this.test.normalizedData)) {
        return this.messages.invalidMessage;
      } else {
        for (const element of this.test.normalizedData) {
          if (element === null) {
            if (!this.options?.normalizedData.allowNullItem) {
              return this.messages.requiredItemMessage;
            }
          } else {
            if (Number.isInteger(element)) {
              if (element < 1) {
                return this.messages.invalidItemMessage;
              }
            } else {
              return this.messages.invalidItemMessage;
            }
          }
        }
      }
    }
    return null;
  }

  private setDescription(valid: boolean) {
    if (valid) {
      return `should validate and return ${JSON.stringify(
        this.test.normalizedData,
      )} when id list is ${this.test.description}`;
    } else {
      return `should fail when id list is ${this.test.description}`;
    }
  }
}

class Results {
  public readonly accepts: OptionTest[];
  public readonly rejects: OptionTest[];
  constructor(optionTests: OptionTest[]) {
    this.accepts = optionTests.filter((optionTest) => optionTest.valid);
    this.rejects = optionTests.filter((optionTest) => !optionTest.valid);
  }
}

class Messages {
  readonly propertyLabel?: string;
  readonly requiredMessage?: string;
  readonly notNullMessage?: string;
  readonly invalidMessage?: string;
  readonly invalidItemMessage?: string;
  readonly requiredItemMessage?: string;

  constructor(messages: {
    propertyLabel?: string;
    requiredMessage?: string;
    notNullMessage?: string;
    invalidMessage?: string;
    invalidItemMessage?: string;
    requiredItemMessage?: string;
  }) {
    this.propertyLabel = messages?.propertyLabel || 'id list';

    this.requiredMessage =
      messages?.requiredMessage || this.propertyLabel + ' is required';

    this.notNullMessage =
      messages?.notNullMessage ||
      this.notNullMessage ||
      'Null ' + this.propertyLabel;

    this.invalidMessage =
      messages?.invalidMessage ||
      this.invalidMessage ||
      'Invalid ' + this.propertyLabel;

    this.invalidItemMessage =
      messages?.invalidItemMessage ||
      this.invalidItemMessage ||
      'Invalid ' + this.propertyLabel + ' item';

    this.requiredItemMessage =
      messages?.requiredItemMessage ||
      this.propertyLabel + ' items cannot be null';
  }
}

export class TestDtoIdListFilter {
  constructor(
    private readonly filterOptions?: {
      onlyQueryParameters?: boolean;
      messages?: {
        propertyLabel?: string;
        requiredMessage?: string;
        notNullMessage?: string;
        invalidMessage?: string;
        invalidItemMessage?: string;
        requiredItemMessage?: string;
      };
      customOptions?: {
        description: string;
        allowNull?: boolean;
        allowUndefined?: boolean;
        allowNullItem?: boolean;
      };
    },
  ) {}

  public getTestData(): Results {
    const optionTests = this.getOptionsTests();
    const results = new Results(optionTests);
    return results;
  }

  private getOptionsTests(): OptionTest[] {
    const messages = new Messages(this.filterOptions.messages);
    const options = this.getOptions();
    const tests = this.getTests();
    const optionsTests: OptionTest[] = [];
    for (let option of options) {
      for (let test of tests) {
        const optionTest = new OptionTest(option, test, messages);
        optionsTests.push(optionTest);
      }
    }
    return optionsTests;
  }

  private getTests(): Test[] {
    let data: Test[] = [
      new Test('""', ''),
      new Test('null', null),
      new Test('[]', []),
      new Test('[1]', [1]),
      new Test('[1, 2]', [1, 2]),
      new Test('[1, 1, 2] (repeated items)', [1, 1, 2]),
      new Test('[null]', [null]),
      new Test('"1"', '1'),
      new Test('"1,2"', '1,2'),
      new Test('1,1,2 (repeated items)', '1,1,2'),
      new Test('"null"', 'null'),
      new Test('"1, null"', '1,null'),

      // invalid
      new Test('undefined', undefined),
      new Test("['1']", ['1']),
      new Test('[undefined]', [undefined]),
      new Test('[true]', [true]),
      new Test('1', 1),
      new Test('true', true),
      new Test('{}', {}),
      new Test('"{}"', '{}'),
      new Test('[-1]', [-1]),
      new Test("['-1']", ['-1']),
      new Test('[1.1]', [1.1]),
      new Test("['1.1']", ['1.1']),
      new Test("['-1.1']", ['-1.1']),
      new Test("['']", ['']),

      new Test('"0"', '0'),
      new Test('"-1"', '-1'),
      new Test('"1.1"', '1.1'),
      new Test('"-1.1"', '-1.1'),
      new Test('"undefined"', 'undefined'),
      new Test('"true"', 'true'),
      new Test('"invalid"', 'invalid'),

      new Test('"1,-2"', '1,-2'),
      new Test('"1.1"', '1.1'),
    ];

    if (this.filterOptions.onlyQueryParameters) {
      data = data.filter((test) => typeof test.data === 'string');
    }
    return data;
  }

  private getOptions(): Options[] {
    if (this.filterOptions.customOptions) {
      const options = [
        new Options(
          this.filterOptions.customOptions.description,
          this.filterOptions.customOptions,
        ),
      ];
      return options;
    }

    const options: Options[] = [
      // allowUndefined
      new Options('options has no properties defined', {}),
      new Options('"allowUndefined" is undefined', {
        allowUndefined: undefined,
      }),
      new Options('"allowUndefined" is null', { allowUndefined: null }),
      new Options('"allowUndefined" is true', { allowUndefined: true }),
      new Options('"allowUndefined" is false', { allowUndefined: false }),
      // allowNull
      new Options('"allowNull" is not defined', {}),
      new Options('"allowNull" is undefined', { allowNull: undefined }),
      new Options('"allowNull" is null', { allowNull: null }),
      new Options('"allowNull" is true', { allowNull: true }),
      new Options('"allowNull" is false', { allowNull: false }),
      new Options('"allowNull" is not defined', {}),
      // allowNullItem
      new Options('"allowNullItem" is undefined', {
        allowNullItem: undefined,
      }),
      new Options('"allowNullItem" is null', {
        allowNullItem: null,
      }),
      new Options('"allowNullItem" is true', {
        allowNullItem: true,
      }),
      new Options('"allowNullItem" is false', {
        allowNullItem: false,
      }),
      // combinations
      new Options('allowNull and allowUndefined are true', {
        allowNull: true,
        allowUndefined: true,
        allowNullItem: false,
      }),
      new Options('allowNull and allowNullItem are true', {
        allowNull: true,
        allowUndefined: false,
        allowNullItem: true,
      }),
      new Options('allowUndefined and allowNullItem are true', {
        allowNull: false,
        allowUndefined: true,
        allowNullItem: true,
      }),
      new Options('allowNull, allowUndefined and allowNullItem are true', {
        allowNull: true,
        allowUndefined: true,
        allowNullItem: true,
      }),
      new Options('allowNull, allowUndefined and allowNullItem are false', {
        allowNull: false,
        allowUndefined: false,
        allowNullItem: false,
      }),
    ];

    return options;
  }
}
