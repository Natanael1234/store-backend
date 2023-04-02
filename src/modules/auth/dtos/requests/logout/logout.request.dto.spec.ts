import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LogoutRequestDto } from './logout.request.dto';
import { validateFirstError } from '../../../../system/utils/validate-first-error';

enum LogoutMessages {
  IS_STRING = 'Refresh token must be a string',
  FORMAT = 'Invalid refresh token',
  REQUIRED = 'Refresh token is required',
}

describe('LogoutRequestDto', () => {
  it('should pass validation', async () => {
    const dto = plainToInstance(LogoutRequestDto, {
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF5bGFuQGJvc2Nhcmluby5jb20iLCJwYXNzd29yZCI6InlhMGdzcWh5NHd6dnV2YjQifQ.yN_8-Mge9mFgsnYHnPEh_ZzNP7YKvSbQ3Alug9HMCsM',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each([
    {
      refreshTokenDescription: 'number',
      refreshToken: 2323232,
      expectedErrors: { isString: LogoutMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'boolean',
      refreshToken: true,
      expectedErrors: { isString: LogoutMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'array',
      refreshToken: [],
      expectedErrors: { isString: LogoutMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'object',
      refreshToken: {},
      expectedErrors: { isString: LogoutMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'null',
      refreshToken: null,
      expectedErrors: { isNotEmpty: LogoutMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'undefined',
      refreshToken: undefined,
      expectedErrors: { isNotEmpty: LogoutMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'empty',
      refreshToken: '',
      expectedErrors: { isNotEmpty: LogoutMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'invalid',
      refreshToken: 'invalid_token',
      expectedErrors: { matches: LogoutMessages.FORMAT },
    },
  ])(
    'should fail validation when refreshToken is $refreshTokenDescription',
    async ({ refreshToken, expectedErrors }) => {
      const data = { refreshToken };
      const errors = await validateFirstError(data, LogoutRequestDto);
      console.error(errors);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('refreshToken');
      expect(errors[0].value).toEqual(data.refreshToken);
      expect(errors[0].constraints).toEqual(expectedErrors);
    },
  );
});
