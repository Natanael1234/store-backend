import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestImages } from '../../../../test/images/test-images';
import { ImagesMetadataMessage } from '../../messages/images-metadata/images-metadata.messages.enum';
import { ImageMetadataParserInterceptor } from './image-metadata-parser.interceptor';

const multipleParametersMessage =
  'Should receive only a single parameter called query';
const invalidMessage = 'Invalid JSON format for the "metadata" parameters';

describe('ImageMetadataParserInterceptor', () => {
  let interceptor;
  let executionContext;
  let callHandler;
  let mock;

  beforeEach(() => {
    // interceptor
    interceptor = new ImageMetadataParserInterceptor();
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
    expect(new ImageMetadataParserInterceptor()).toBeDefined();
  });

  it('should convert valid body.metadata from string to plain object', async () => {
    const [file1, file2] = await TestImages.buildFiles(2);
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 0, name: 'Image 1' }]) },
      files: [file1, file2],
    });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    // check query params after
    const bodyAfter = executionContext.switchToHttp().getRequest().body;
    expect(bodyAfter).toEqual({
      metadata: [{ fileIdx: 0, name: 'Image 1' }],
    });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should convert valid body.metadata from string to plain object when files are not defined', async () => {
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 0, name: 'Image 1' }]) },
    });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    // check query params after
    const bodyAfter = executionContext.switchToHttp().getRequest().body;
    expect(bodyAfter).toEqual({
      metadata: [{ fileIdx: 0, name: 'Image 1' }],
    });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is not defined', async () => {
    const files = await TestImages.buildFiles(1);
    mock.mockReturnValue({ body: {} });

    try {
      await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).not.toBeDefined();
    }

    // check query params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is null', async () => {
    mock.mockReturnValue({ body: { metadata: null } });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is undefined', async () => {
    mock.mockReturnValue({ body: { metadata: undefined } });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is not defined', async () => {
    mock.mockReturnValue({ body: {} });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is null string', async () => {
    mock.mockReturnValue({ body: { metadata: 'null' } });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is empty string', async () => {
    mock.mockReturnValue({ body: { metadata: '' } });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should replace body.metadata by empty array of metadata when body.metadata is not defined', async () => {
    mock.mockReturnValue({ body: {} });
    try {
      const ret = await interceptor.intercept(executionContext, callHandler);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe(invalidMessage);
    }

    // check request params after
    const requestAfter = executionContext.switchToHttp().getRequest().body;
    expect(requestAfter).toEqual({ metadata: [] });

    // check if handler was called just one time
    expect(callHandler.handle).toBeCalledTimes(1);
  });

  it('should reject when body.metadata is malformed json string', async () => {
    mock.mockReturnValue({ body: { metadata: '[' } });

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

  it('should reject when metadata is number string', async () => {
    mock.mockReturnValue({ body: { metadata: '1' } });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.METADATA_ARRAY_INVALID);
    }
  });

  it('should reject when body.metadata is boolean string', async () => {
    mock.mockReturnValue({ body: { metadata: 'true' } });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.METADATA_ARRAY_INVALID);
    }
  });

  it('should reject when body.metadata is object string', async () => {
    mock.mockReturnValue({ body: { metadata: '{}' } });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.METADATA_ARRAY_INVALID);
    }
  });

  it('should reject when metadata references a invalid file index', async () => {
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 100 }]), files: [] },
    });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.FILE_IDX_NOT_FOUND);
    }
  });

  it('should reject when metadata references a file index but files is not defined', async () => {
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 100 }]) },
    });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.FILE_IDX_NOT_FOUND);
    }
  });

  it('should reject when metadata references a file index but files is null', async () => {
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 100 }]), files: null },
    });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.FILE_IDX_NOT_FOUND);
    }
  });

  it('should reject when metadata references a file index but files is undefined', async () => {
    mock.mockReturnValue({
      body: { metadata: JSON.stringify([{ fileIdx: 100 }]), files: null },
    });

    try {
      const actualValue = await interceptor.intercept(
        executionContext,
        callHandler,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(error.message).toBe(ImagesMetadataMessage.FILE_IDX_NOT_FOUND);
    }
  });
});
