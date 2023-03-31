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
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public async generateAccessToken(user: UserEntity): Promise<string> {
    if (!user) throw new UnprocessableEntityException('User is required');
    if (!user.id) throw new UnprocessableEntityException('User id is required');
    const opts: SignOptions = {
      ...BASE_OPTIONS,
      subject: String(user.id),
    };

    return await this.jwtService.signAsync({}, opts);
  }

  public async generateRefreshToken(user: UserEntity): Promise<string> {
    const exp = JWTConfigs.REFRESH_TOKEN_EXPIRATION as StringValue;
    const ttl = ms(exp);
    const token = await this.refreshTokenRepository.createRefreshToken(
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
    if (!encodedRefreshToken)
      throw new UnprocessableEntityException('Refresh token is required');
    // TODO: testar se encodedRefreshToken existe?
    const { user, refreshToken } = await this.resolveRefreshToken(
      encodedRefreshToken,
    );
    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found');
    }
    if (!refreshToken.revoked) {
      refreshToken.revoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
    return true;
  }

  public async resolveRefreshToken(
    encodedRefreshToken: string,
  ): Promise<{ user: UserEntity; refreshToken: RefreshTokenEntity }> {
    const payload = await this.decodeRefreshToken(encodedRefreshToken);
    const refreshToken =
      await this.getStoredTRefreshTokenFromRefreshTokenPayload(payload);

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
    refreshToken: string,
  ): Promise<{ token: string; user: UserEntity }> {
    if (!refreshToken)
      throw new UnprocessableEntityException('Refresh token is required');
    const { user } = await this.resolveRefreshToken(refreshToken);
    const token = await this.generateAccessToken(user);
    return { user, token };
  }

  private async decodeRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    if (!refreshToken)
      throw new UnprocessableEntityException('Refresh token is required');
    try {
      return this.jwtService.verifyAsync(refreshToken);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired');
      } else {
        throw new UnprocessableEntityException('Refresh token malformed');
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    refreshTokenPayload: RefreshTokenPayload,
  ): Promise<UserEntity> {
    if (!refreshTokenPayload)
      throw new UnprocessableEntityException('Payload is required');
    const subId = refreshTokenPayload.sub;

    if (!subId) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    return this.usersService.findForId(+subId);
  }

  private async getStoredTRefreshTokenFromRefreshTokenPayload(
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenEntity | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    const refreshToken = await this.refreshTokenRepository.findTokenById(
      tokenId,
    );
    if (refreshToken.revoked)
      throw new UnauthorizedException('Invalid refresh token');
    return refreshToken;
  }
}
