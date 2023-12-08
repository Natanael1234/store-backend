import { plainToInstance } from 'class-transformer';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { RefreshTokenMessage } from '../../../messages/refresh-token/refresh-token.messages.enum';
import { RefreshRequestDto } from './refresh.request.dto';

describe('RefreshRequestDto', () => {
  it('should pass validation', async () => {
    const dto = plainToInstance(RefreshRequestDto, {
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF5bGFuQGJvc2Nhcmluby5jb20iLCJwYXNzd29yZCI6InlhMGdzcWh5NHd6dnV2YjQifQ.yN_8-Mge9mFgsnYHnPEh_ZzNP7YKvSbQ3Alug9HMCsM',
    });
    const errors = await validateFirstError(dto, RefreshRequestDto);
    expect(errors).toHaveLength(0);
  });

  async function testReject(refreshToken, expectedErrors) {
    const data = { refreshToken };
    const dto = plainToInstance(RefreshRequestDto, data);
    const errors = await validateFirstError(dto, RefreshRequestDto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('refreshToken');
    expect(errors[0].value).toEqual(data.refreshToken);
    expect(errors[0].constraints).toEqual(expectedErrors);
  }

  it("should fail validation when refreshToken is 'number'", async () => {
    await testReject(2323232, { isString: RefreshTokenMessage.STRING });
  });

  it("should fail validation when refreshToken is 'boolean'", async () => {
    await testReject(true, { isString: RefreshTokenMessage.STRING });
  });

  it("should fail validation when refreshToken is 'array'", async () => {
    await testReject([], { isString: RefreshTokenMessage.STRING });
  });

  it("should fail validation when refreshToken is 'object'", async () => {
    await testReject({}, { isString: RefreshTokenMessage.STRING });
  });

  it("should fail validation when refreshToken is 'null'", async () => {
    await testReject(null, { isNotEmpty: RefreshTokenMessage.REQUIRED });
  });

  it("should fail validation when refreshToken is 'undefined'", async () => {
    await testReject(undefined, { isNotEmpty: RefreshTokenMessage.REQUIRED });
  });

  it("should fail validation when refreshToken is 'empty'", async () => {
    await testReject('', { isNotEmpty: RefreshTokenMessage.REQUIRED });
  });

  it("should fail validation when refreshToken is 'invalid'", async () => {
    await testReject('invalid_token', { matches: RefreshTokenMessage.INVALID });
  });
});
