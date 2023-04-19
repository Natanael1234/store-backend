import { plainToInstance } from 'class-transformer';
import { LogoutRequestDto } from './logout.request.dto';
import { validateFirstError } from '../../../../system/utils/validation';
import { RefreshTokenMessage } from '../../../enums/refresh-token-messages.ts/refresh-token-messages.enum';

describe('LogoutRequestDto', () => {
  it('should pass validation', async () => {
    const dto = plainToInstance(LogoutRequestDto, {
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF5bGFuQGJvc2Nhcmluby5jb20iLCJwYXNzd29yZCI6InlhMGdzcWh5NHd6dnV2YjQifQ.yN_8-Mge9mFgsnYHnPEh_ZzNP7YKvSbQ3Alug9HMCsM',
    });
    const errors = await validateFirstError(dto, LogoutRequestDto);
    expect(errors).toHaveLength(0);
  });

  it.each([
    {
      refreshTokenDescription: 'number',
      refreshToken: 2323232,
      expectedErrors: { isString: RefreshTokenMessage.STRING },
    },
    {
      refreshTokenDescription: 'boolean',
      refreshToken: true,
      expectedErrors: { isString: RefreshTokenMessage.STRING },
    },
    {
      refreshTokenDescription: 'array',
      refreshToken: [],
      expectedErrors: { isString: RefreshTokenMessage.STRING },
    },
    {
      refreshTokenDescription: 'object',
      refreshToken: {},
      expectedErrors: { isString: RefreshTokenMessage.STRING },
    },
    {
      refreshTokenDescription: 'null',
      refreshToken: null,
      expectedErrors: { isNotEmpty: RefreshTokenMessage.REQUIRED },
    },
    {
      refreshTokenDescription: 'undefined',
      refreshToken: undefined,
      expectedErrors: { isNotEmpty: RefreshTokenMessage.REQUIRED },
    },
    {
      refreshTokenDescription: 'empty',
      refreshToken: '',
      expectedErrors: { isNotEmpty: RefreshTokenMessage.REQUIRED },
    },
    {
      refreshTokenDescription: 'invalid',
      refreshToken: 'invalid_token',
      expectedErrors: { matches: RefreshTokenMessage.INVALID },
    },
  ])(
    'should fail validation when refreshToken is $refreshTokenDescription',
    async ({ refreshToken, expectedErrors }) => {
      const data = { refreshToken };
      const errors = await validateFirstError(data, LogoutRequestDto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('refreshToken');
      expect(errors[0].value).toEqual(data.refreshToken);
      expect(errors[0].constraints).toEqual(expectedErrors);
    },
  );
});
