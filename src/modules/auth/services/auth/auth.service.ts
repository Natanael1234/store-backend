import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CachingService } from '../../../system/caching/services/caching.service';
import { UserEntity } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { LoginRequestDto } from '../../dtos/requests/login/login.request.dto';
import { LogoutRequestDto } from '../../dtos/requests/logout/logout.request.dto';
import { RefreshRequestDto } from '../../dtos/requests/refresh/refresh.request.dto';
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
    private cachingService: CachingService,
    private tokenService: TokenService,
  ) {}

  public async register(
    registerRequestDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
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

  public async refresh(
    refreshRequestDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    const { user, token } =
      await this.tokenService.createAccessTokenFromRefreshToken(
        refreshRequestDto.refresh_token,
      );
    const payload = this.buildResponsePayload(user, token);
    return {
      status: 'success',
      data: payload,
    };
  }

  public async logout(logoutRequestDto: LogoutRequestDto) {
    if (!logoutRequestDto.refresh_token)
      new ForbiddenException('No refresh token provided');

    // TODO: schedule revoked tokens removal
    const revoked = await this.tokenService.revokeRefreshToken(
      logoutRequestDto.refresh_token,
    );

    // TODO: blacklist token

    // add bearer token to blacklist
    // await this.cachingService.setValue(bearerToken, token); // TODO: add ttl
    return revoked;
  }

  private buildResponsePayload(
    user: UserEntity,
    accessToken: string,
    refreshToken?: string,
  ): AuthenticationPayloadDto {
    return {
      // hides hash/password
      user: { ...user, hash: undefined },
      payload: {
        type: 'bearer',
        token: accessToken,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
      },
    };
  }
}
