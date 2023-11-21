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
  let guard: JwtAuthenticationGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthenticationGuard(reflector);
  });

  describe('canActivate', () => {
    it('should return true when IS_PUBLIC_ROUTE is true', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
      const context = createMock<ExecutionContext>();
      const canActivate = guard.canActivate(context);

      expect(canActivate).toBe(true);
    });

    it.skip('should return true when IS_PUBLIC_ROUTE is true', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false); // TODO: ERROR: https://stackoverflow.com/questions/67832906/unit-testing-nestjs-guards-unknown-authentication-strategy
      const context = createMock<ExecutionContext>();
      const canActivate = guard.canActivate(context);

      expect(canActivate).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when only receive user', () => {
      const user = new User();
      user.id = 'fake-uuid'; // TODO: testar
      const ret = guard.handleRequest(null, user, null);
      expect(ret).toStrictEqual(user);
    });

    it("should fail when don't receive error, user and info", () => {
      const fn = () => guard.handleRequest(null, null, null);
      expect(fn).toThrow(UnauthorizedException);
    });

    it('should fail when receive error', () => {
      const fn = () =>
        guard.handleRequest(new NotFoundException(), new User(), null);
      expect(fn).toThrow(NotFoundException);
    });

    it('should fail when receive info', () => {
      const fn = () => guard.handleRequest(null, new User(), new Error('test'));
      expect(fn).toThrow(Error);
    });

    it('should fail when receive error and info', () => {
      const fn = () =>
        guard.handleRequest(
          new NotFoundException(),
          new User(),
          new Error('test'),
        );
      expect(fn).toThrow(NotFoundException);
    });
  });
});
