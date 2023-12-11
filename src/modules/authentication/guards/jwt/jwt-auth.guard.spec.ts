import { createMock } from '@golevelup/ts-jest';
import {
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../../user/models/user/user.entity';
import { JwtAuthenticationGuard } from './jwt-auth.guard';

describe('JwtAutthGuard', () => {
  it('should be defined', () => {
    expect(JwtAuthenticationGuard).toBeDefined();
  });

  it('should instantiate guard', () => {
    let reflector = new Reflector();
    const guard = new JwtAuthenticationGuard(reflector);
  });

  describe('canActivate', () => {
    // TODO: error
    it.skip('should return true when IS_PUBLIC_ROUTE is true', async () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);

      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
      const context = createMock<ExecutionContext>();
      const canActivate = await guard.canActivate(context);

      expect(canActivate).toBe(true);
    });

    it.skip('should return true when IS_PUBLIC_ROUTE is true', () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);

      reflector.getAllAndOverride = jest.fn().mockReturnValue(false); // TODO: ERROR: https://stackoverflow.com/questions/67832906/unit-testing-nestjs-guards-unknown-authentication-strategy
      const context = createMock<ExecutionContext>();
      const canActivate = guard.canActivate(context);

      expect(canActivate).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when only receive user', () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);
      const context = createMock<ExecutionContext>();
      const user = new User();
      user.id = 'fake-uuid'; // TODO: testar
      const ret = guard.handleRequest(null, user, null, context);
      expect(ret).toStrictEqual(user);
    });

    it("should fail when don't receive error, user and info", () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);
      const context = createMock<ExecutionContext>();
      const fn = () => guard.handleRequest(null, null, null, context);
      expect(fn).toThrow(UnauthorizedException);
    });

    it('should fail when receive error', () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);
      const context = createMock<ExecutionContext>();
      const fn = () =>
        guard.handleRequest(new NotFoundException(), new User(), null, context);
      expect(fn).toThrow(NotFoundException);
    });

    it('should fail when receive info', () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);
      const context = createMock<ExecutionContext>();
      const fn = () =>
        guard.handleRequest(null, new User(), new Error('test'), context);
      expect(fn).toThrow(Error);
    });

    it('should fail when receive error and info', () => {
      let reflector = new Reflector();
      const guard = new JwtAuthenticationGuard(reflector);
      const context = createMock<ExecutionContext>();
      const fn = () =>
        guard.handleRequest(
          new NotFoundException(),
          new User(),
          new Error('test'),
          context,
        );
      expect(fn).toThrow(NotFoundException);
    });
  });
});
