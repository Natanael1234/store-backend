import { BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { QueryParamToJsonInterceptor } from './query-param-to-json.interceptor';

const multipleParametersMessage =
  'Should receive only a single parameter called query';
const invalidMessage = 'Invalid JSON format for the "query" parameters';

describe('QueryParamToJsonInterceptor', () => {
  let interceptor;
  let executionContext;
  let callHandler;
  let mock;

  beforeEach(() => {
    // interceptor
    interceptor = new QueryParamToJsonInterceptor();
    // context
    executionContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnThis(),
    };
    // handler
    callHandler = {
      handle: jest.fn(),
    };

    mock = executionContext.switchToHttp().getRequest as jest.Mock<any, any>;
  });

  it('should be defined', () => {
    expect(new QueryParamToJsonInterceptor()).toBeDefined();
  });

  it('should transform queryParams from string to JSON', async () => {
    mock.mockReturnValue({ query: { query: '{"a" : 1}' } });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    // check query params after
    const queryAfter = executionContext.switchToHttp().getRequest().query;
    expect(queryAfter).toEqual({ query: { a: 1 } });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should accept queryParams not defined', async () => {
    mock.mockReturnValue({ query: {} });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    // check query params after
    const queryAfter = executionContext.switchToHttp().getRequest().query;
    expect(queryAfter).toEqual({ query: {} });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should fail when queryParams is not string', async () => {
    mock.mockReturnValue({
      query: { query: { a: 1 } },
    });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });

  it('should fail when queryParams is null', async () => {
    mock.mockReturnValue({ query: { query: { a: null } } });

    try {
      const actualValue = await firstValueFrom(
        interceptor.intercept(executionContext, callHandler),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });

  it('should fail when queryParams is "null"', async () => {
    mock.mockReturnValue({ query: { query: { a: 'null' } } });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });

  it('should fail when queryParams is undefined', async () => {
    mock.mockReturnValue({ query: { query: { a: undefined } } });

    try {
      const actualValue = await firstValueFrom(
        interceptor.intercept(executionContext, callHandler),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });

  it('should fail when queryParams is "undefined"', async () => {
    mock.mockReturnValue({ query: { query: { a: 'undefined' } } });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });

  it('should fail when queryParams ismalformed json string', async () => {
    mock.mockReturnValue({ query: { query: '{' } });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }
  });
});
