import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LogoutRequestDto } from './logout.request.dto';

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
      expectedErrors: {
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'boolean',
      refreshToken: true,
      expectedErrors: {
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'array',
      refreshToken: [],
      expectedErrors: {
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'object',
      refreshToken: {},
      expectedErrors: {
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'null',
      refreshToken: null,
      expectedErrors: {
        isNotEmpty: 'Refresh token is required',
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'undefined',
      refreshToken: undefined,
      expectedErrors: {
        isNotEmpty: 'Refresh token is required',
        isString: 'Refresh token must be a string',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'empty',
      refreshToken: '',
      expectedErrors: {
        isNotEmpty: 'Refresh token is required',
        matches: 'Invalid refresh token',
      },
    },
    {
      refreshTokenDescription: 'invalid',
      refreshToken: 'invalid_token',
      expectedErrors: {
        matches: 'Invalid refresh token',
      },
    },
  ])(
    'should fail validation when refreshToken is $refreshTokenDescription',
    async ({ refreshToken, expectedErrors }) => {
      const data = {
        refreshToken,
      };
      const dto = plainToInstance(LogoutRequestDto, data);
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('refreshToken');
      expect(errors[0].value).toEqual(data.refreshToken);
      expect(errors[0].constraints).toEqual(expectedErrors);
    },
  );
});
