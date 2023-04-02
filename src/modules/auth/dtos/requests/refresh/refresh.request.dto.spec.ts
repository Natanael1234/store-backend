import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RefreshRequestDto } from './refresh.request.dto';

enum RefreshtMessages {
  IS_STRING = 'Refresh token must be a string',
  FORMAT = 'Invalid refresh token',
  REQUIRED = 'Refresh token is required',
}

describe('RefreshRequestDto', () => {
  it('should pass validation', async () => {
    const dto = plainToInstance(RefreshRequestDto, {
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
      expectedErrors: { isString: RefreshtMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'boolean',
      refreshToken: true,
      expectedErrors: { isString: RefreshtMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'array',
      refreshToken: [],
      expectedErrors: { isString: RefreshtMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'object',
      refreshToken: {},
      expectedErrors: { isString: RefreshtMessages.IS_STRING },
    },
    {
      refreshTokenDescription: 'null',
      refreshToken: null,
      expectedErrors: { isNotEmpty: RefreshtMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'undefined',
      refreshToken: undefined,
      expectedErrors: { isNotEmpty: RefreshtMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'empty',
      refreshToken: '',
      expectedErrors: { isNotEmpty: RefreshtMessages.REQUIRED },
    },
    {
      refreshTokenDescription: 'invalid',
      refreshToken: 'invalid_token',
      expectedErrors: { matches: RefreshtMessages.FORMAT },
    },
  ])(
    'should fail validation when refreshToken is $refreshTokenDescription',
    async ({ refreshToken, expectedErrors }) => {
      const data = { refreshToken };
      const dto = plainToInstance(RefreshRequestDto, data);
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('refreshToken');
      expect(errors[0].value).toEqual(data.refreshToken);
      expect(errors[0].constraints).toEqual(expectedErrors);
    },
  );
});
