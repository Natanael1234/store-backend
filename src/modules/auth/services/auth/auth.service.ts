import {
  BadRequestException,
  Body,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common/exceptions';
import { UserEntity } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { LoginRequestDto } from '../../dtos/requests/login/login.request.dto';
import { RegisterRequestDto } from '../../dtos/requests/register/register.request.dto';
import { AuthenticationPayloadDto } from '../../dtos/responses/authenticationPayload.dto';
import { LoginResponseDto } from '../../dtos/responses/login.response.dto';
import { RefreshResponseDto } from '../../dtos/responses/refresh.response.dto';
import { RegisterResponseDto } from '../../dtos/responses/register.response.dto';
import { TokenService } from '../token/token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  public async register(
    registerRequestDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    if (!registerRequestDto)
      throw new BadRequestException('User data is required');
    if (!registerRequestDto.password)
      throw new UnprocessableEntityException('Password is required');
    if (!registerRequestDto.email)
      throw new UnprocessableEntityException('Email is required');
    if (!registerRequestDto.name)
      throw new UnprocessableEntityException('Name is required');
    if (!registerRequestDto.password)
      throw new UnprocessableEntityException('Password is required');

    const user = await this.userService.create(registerRequestDto);
    const token = await this.tokenService.generateAccessToken(user);
    const refresh = await this.tokenService.generateRefreshToken(user);
    const payload = this.buildResponsePayload(user, token, refresh);
    return {
      status: 'success',
      data: payload,
    };
  }

  public async login(
    loginRequestDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    if (!loginRequestDto)
      throw new BadRequestException('User credentials is required');
    if (!loginRequestDto.email)
      throw new UnprocessableEntityException('Email is required');
    if (!loginRequestDto.password)
      throw new UnprocessableEntityException('Password is required');
    const user = await this.userService.validateCredentials(
      loginRequestDto.email,
      loginRequestDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('The login is invalid');
    }

    const token = await this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);

    const payload = this.buildResponsePayload(user, token, refreshToken);

    return {
      status: 'success',
      data: payload,
    };
  }

  public async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    const { user, token } =
      await this.tokenService.createAccessTokenFromRefreshToken(refreshToken);
    const payload = this.buildResponsePayload(user, token);
    return {
      status: 'success',
      data: payload,
    };
  }

  public async logout(refreshToken: string) {
    // TODO: pegar os dados de refresh token da sessão.
    if (refreshToken) new ForbiddenException('No refresh token provided');

    // TODO: schedule revoked tokens removal
    await this.tokenService.revokeRefreshToken(refreshToken);

    // add bearer token to blacklist
    // await this.cachingService.setValue(bearerToken, token); // TODO: add ttl
    return true;
  }

  private buildResponsePayload(
    user: UserEntity,
    accessToken: string,
    refreshToken?: string,
  ): AuthenticationPayloadDto {
    if (!user) throw new UnprocessableEntityException('User is required');
    if (!user.id) throw new UnprocessableEntityException('User id is required');
    if (!accessToken)
      throw new UnprocessableEntityException('Access token is not defined');
    return {
      // hides hash/password
      user: { ...user, hash: undefined },
      payload: {
        type: 'bearer',
        token: accessToken,
        ...(refreshToken ? { refreshToken: refreshToken } : {}),
      },
    };
  }
}
