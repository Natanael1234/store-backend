import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { UserEntity } from '../../../user/models/user/user.entity';

describe('JwtAutthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
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
      const user = new UserEntity();
      user.id = 3;
      const ret = guard.handleRequest(null, user, null);
      expect(ret).toStrictEqual(user);
    });

    it("should fail when don't receive error, user and info", () => {
      const fn = () => guard.handleRequest(null, null, null);
      expect(fn).toThrow(UnauthorizedException);
    });

    it('should fail when receive error', () => {
      const fn = () =>
        guard.handleRequest(new NotFoundException(), new UserEntity(), null);
      expect(fn).toThrow(NotFoundException);
    });

    it('should fail when receive info', () => {
      class Teste {}
      const fn = () => guard.handleRequest(null, new UserEntity(), new Teste());
      expect(fn).toThrow(Teste);
    });

    it('should fail when receive error and info', () => {
      class Teste {}
      const fn = () =>
        guard.handleRequest(
          new NotFoundException(),
          new UserEntity(),
          new Teste(),
        );
      expect(fn).toThrow(NotFoundException);
    });
  });
});
