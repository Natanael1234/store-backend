import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { RefreshTokenEntity } from '../../models/refresh-token.entity';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { BASE_OPTIONS } from './dtos/jwt-signin-base-options.';
import { RefreshTokenPayload } from './dtos/refresh-token-payload';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { JWTConfigs } from '../../configs/jwt.config';
import { UserService } from '../../../user/services/user/user.service';
import { UserEntity } from '../../../user/models/user/user.entity';
import ms, { StringValue } from '../../../system/utils/time/ms/ms';

@Injectable()
export class TokenService {
  constructor(
    private readonly refresnTokenRepository: RefreshTokenRepository,
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public async generateAccessToken(user: UserEntity): Promise<string> {
    const opts: SignOptions = {
      ...BASE_OPTIONS,
      subject: String(user.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  public async generateRefreshToken(user: UserEntity): Promise<string> {
    const exp = JWTConfigs.REFRESH_TOKEN_EXPIRATION as StringValue;
    const ttl = ms(exp);
    const token = await this.refresnTokenRepository.createRefreshToken(
      user,
      ttl,
    );
    const opts: JwtSignOptions = {
      expiresIn: ttl,
      ...BASE_OPTIONS,
      subject: String(user.id),
      jwtid: String(token.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  public async revokeRefreshToken(encodedRefreshToken: string) {
    // TODO: testar se encodedRefreshToken existe?
    const { user, refreshToken } = await this.resolveRefreshToken(
      encodedRefreshToken,
    );
    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found');
    }
    if (!refreshToken.revoked) {
      refreshToken.revoked = true;
      await this.refresnTokenRepository.save(refreshToken);
    }
    return true;
  }

  public async resolveRefreshToken(
    encodedRefreshToken: string,
  ): Promise<{ user: UserEntity; refreshToken: RefreshTokenEntity }> {
    const payload = await this.decodeRefreshToken(encodedRefreshToken);
    const refreshToken = await this.getStoredTokenFromRefreshTokenPayload(
      payload,
    );

    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found');
    }

    if (refreshToken.revoked) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    return { user, refreshToken };
  }

  public async createAccessTokenFromRefreshToken(
    refresh: string,
  ): Promise<{ token: string; user: UserEntity }> {
    const { user } = await this.resolveRefreshToken(refresh);

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  private async decodeRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired');
      } else {
        throw new UnprocessableEntityException('Refresh token malformed');
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: RefreshTokenPayload,
  ): Promise<UserEntity> {
    const subId = payload.sub;

    if (!subId) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    return this.usersService.findForId(subId);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenEntity | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    const token = await this.refresnTokenRepository.findTokenById(tokenId);
    return token;
  }
}
