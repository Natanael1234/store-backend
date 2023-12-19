import { Reflector } from '@nestjs/core';

import { Role } from '../../../authentication/enums/role/role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    mockContext
      .switchToHttp()
      .getRequest.mockReturnValue({ user: { roles: [Role.ADMIN] } });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    mockContext
      .switchToHttp()
      .getRequest.mockReturnValue({ user: { roles: [Role.USER] } });

    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should allow access if user has at least one required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN, Role.USER]);
    mockContext
      .switchToHttp()
      .getRequest.mockReturnValue({ user: { roles: [Role.USER] } });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access if user does not have any required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ROOT, Role.ADMIN]);
    mockContext
      .switchToHttp()
      .getRequest.mockReturnValue({ user: { roles: [Role.USER] } });

    expect(guard.canActivate(mockContext)).toBe(false);
  });

  async function testReject(data: { user?: any }) {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ROOT, Role.ADMIN]);
    mockContext.switchToHttp().getRequest.mockReturnValue(data);

    expect(guard.canActivate(mockContext)).toBe(false);
  }

  it('should deny access if user is null', async () => {
    await testReject({ user: null });
  });

  it('should deny access if user is undefined', async () => {
    await testReject({ user: undefined });
  });

  it('should deny access if user is not defined', async () => {
    await testReject({});
  });
});
