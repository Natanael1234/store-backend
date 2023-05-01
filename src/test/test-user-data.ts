import { Role } from '../modules/authentication/enums/role/role.enum';
import { TestPurpose } from './test-data';

export class TestUserData {
  /** service/api */
  static get creationData() {
    return [
      {
        name: 'User 1',
        password: 'Abc12*',
        email: 'user1@email.com',
        roles: [Role.ROOT],
      },
      {
        name: 'User 2',
        password: 'Xyz12*',
        email: 'user2@email.com',
        roles: [Role.USER],
      },
      {
        name: 'User 3',
        password: 'Cba12*',
        email: 'user3@email.com',
        roles: [Role.ADMIN],
      },
    ];
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
}
