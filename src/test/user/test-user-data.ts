import { Role } from '../../modules/authentication/enums/role/role.enum';
import { EncryptionService } from '../../modules/system/encryption/services/encryption/encryption.service';
import { TestPurpose } from '../test-data';

export class TestUserData {
  /** service/api */
  static get creationData() {
    return [
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    ];
  }

  public static buildData(quantity: number, startNumber?: number) {
    if (startNumber == null) startNumber = 1;
    const arr = Array(quantity);
    for (let i = 0, j = startNumber; i < arr.length; i++, j++) {
      arr[i] = {
        name: `User ${j}`,
        password: 'Abc12*',
        email: `user${j}@email.com`,
        roles: [Role.ROOT],
        active: true,
        deletedAt: undefined,
      };
    }
    return arr;
  }

  static get updateData() {
    return TestUserData.creationData.map((data) => {
      const { name, email } = data;
      return { name, email };
    });
  }

  /** service/api */
  static get registerData(): {
    name: string;
    email: string;
    password: string;
    acceptTerms: true;
  }[] {
    return TestUserData.creationData.map((createUserData) => {
      const { name, email, password } = createUserData;
      return { name, email, password, acceptTerms: true };
    });
  }

  /** repository */
  static dataForRepository(options?: { passwords: boolean }) {
    return TestUserData.creationData.map((createUserData) => {
      if (options?.passwords === false) {
        delete options.passwords;
      }
      return {
        ...createUserData,
        hash: { iv: 'x', encryptedData: 'y' },
      };
    });
  }

  private static getData(purpose: TestPurpose) {
    if (purpose == 'create') {
      return TestUserData.creationData;
    } else if (purpose == 'register') {
      return TestUserData.registerData;
    } else {
      return TestUserData.updateData;
    }
  }

  /**
   * Converts password to hash.
   */
  public static async normalizeData(
    encryptionService: EncryptionService,
    usersData: {
      name?: string;
      email?: string;
      password?: string;
      roles?: Role[];
      active?: boolean;
    }[],
  ): Promise<
    {
      name?: string;
      email?: string;
      hash?: { iv?: string; encryptedData?: string };
      roles?: Role[];
      active?: boolean;
    }[]
  > {
    const normalizedData = [];
    for (let userData of usersData) {
      normalizedData.push({
        name: userData.name,
        email: userData.email,
        hash: await encryptionService.encrypt(userData.password),
        roles: userData.roles,
        active: userData.active,
      });
    }
    return normalizedData;
  }
  public static async buildNormalizedData(
    encryptionService: EncryptionService,
    quantity,
  ) {
    return TestUserData.normalizeData(
      encryptionService,
      TestUserData.buildData(quantity),
    );
  }
}
