import { TestUserData } from '../../../../test/test-user-data';
import { validateFirstError } from '../../../system/utils/validation';
import { UpdatePasswordRequestDTO } from './update-password.request.dto';

describe('CreateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = { password: 'Ab123*' };
    const errors = await validateFirstError(data, UpdatePasswordRequestDTO);
    expect(errors).toHaveLength(0);
  });

  it.each(TestUserData.getPasswordErrorDataList('create'))(
    'should fail validation when password is $description',
    async ({ data, expectedErrors }) => {
      const errors = await validateFirstError(data, UpdatePasswordRequestDTO);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('password');
      expect(errors[0].value).toEqual(data.password);
      expect(errors[0].constraints).toEqual(expectedErrors);
    },
  );

  it('Should validate passwords wwith valid length', async () => {
    const data = [
      { password: 'Abc12*' },
      { password: 'Abc12*' + 'x'.repeat(6) },
    ];
    const errors = [
      await validateFirstError(data[0], UpdatePasswordRequestDTO),
      await validateFirstError(data[1], UpdatePasswordRequestDTO),
    ];

    expect(errors[0]).toHaveLength(0);
    expect(errors[1]).toHaveLength(0);
  });
});
