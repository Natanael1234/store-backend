import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { AuthorizationMessage } from '../../../system/messages/authorization/authorization.messages.enum';
import ms, { StringValue } from '../../../system/utils/time/ms/ms';
import { UserMessage } from '../../../user/enums/messages/user/user.messages.enum';
import { User } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { JWTConfigs } from '../../configs/jwt.configs';
import { RefreshTokenMessage } from '../../messages/refresh-token/refresh-token.messages.enum';
import { RefreshToken } from '../../models/refresh-token.entity';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { BASE_OPTIONS } from './dtos/jwt-signin-base-options';
import { RefreshTokenPayload } from './dtos/refresh-token-payload';

@Injectable()
export class TokenService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public async generateAccessToken(user: User): Promise<string> {
    if (!user) throw new UnprocessableEntityException(UserMessage.REQUIRED);
    if (!user.id)
      throw new UnprocessableEntityException(UserMessage.ID_REQUIRED);
    const opts: SignOptions = {
      ...BASE_OPTIONS,
      // subject: String(user.id), // TODO: remover
      subject: user.id,
    };

    return await this.jwtService.signAsync({}, opts);
  }

  public async generateRefreshToken(user: User): Promise<string> {
    const exp = JWTConfigs.REFRESH_TOKEN_EXPIRATION as StringValue;
    const ttl = ms(exp);
    const token = await this.refreshTokenRepository.createRefreshToken(
      user,
      ttl,
    );
    const opts: JwtSignOptions = {
      expiresIn: ttl,
      ...BASE_OPTIONS,
      // subject: String(user.id), // TODO: remover
      subject: user.id,
      jwtid: String(token.id),
    };
    return this.jwtService.signAsync({}, opts);
  }

  public async revokeRefreshToken(encodedRefreshToken: string) {
    if (!encodedRefreshToken)
      throw new UnprocessableEntityException(RefreshTokenMessage.REQUIRED);
    // TODO: testar se encodedRefreshToken existe?
    const { user, refreshToken } = await this.resolveRefreshToken(
      encodedRefreshToken,
    );
    if (user && !user.active) {
      throw new UnauthorizedException(AuthorizationMessage.NOT_AUTORIZED);
    }
    if (!refreshToken) {
      throw new NotFoundException(RefreshTokenMessage.NOT_FOUND);
    }
    if (!refreshToken.revoked) {
      refreshToken.revoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
    return true;
  }

  public async createAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<{ token: string; user: User }> {
    if (!refreshToken)
      throw new UnprocessableEntityException(RefreshTokenMessage.REQUIRED);
    const { user } = await this.resolveRefreshToken(refreshToken);
    const token = await this.generateAccessToken(user);
    return { user, token };
  }

  public async resolveRefreshToken(
    encodedRefreshToken: string,
  ): Promise<{ user: User; refreshToken: RefreshToken }> {
    const payload = await this.decodeRefreshToken(encodedRefreshToken);
    const refreshToken =
      await this.getStoredTRefreshTokenFromRefreshTokenPayload(payload);

    if (!refreshToken) {
      throw new NotFoundException(RefreshTokenMessage.NOT_FOUND);
    }

    if (refreshToken.revoked) {
      throw new UnauthorizedException(RefreshTokenMessage.REVOKED);
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new UnprocessableEntityException(RefreshTokenMessage.MALFORMED);
    }

    return { user, refreshToken };
  }

  private async decodeRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    if (!refreshToken)
      throw new UnprocessableEntityException(RefreshTokenMessage.REQUIRED);
    try {
      return this.jwtService.verifyAsync(refreshToken);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnprocessableEntityException(RefreshTokenMessage.EXPIRED);
      } else {
        throw new UnprocessableEntityException(RefreshTokenMessage.MALFORMED);
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    refreshTokenPayload: RefreshTokenPayload,
  ): Promise<User> {
    if (!refreshTokenPayload)
      throw new UnprocessableEntityException(
        RefreshTokenMessage.PAYLOAD_REQUIRED,
      );
    const subId = refreshTokenPayload.sub;

    if (!subId) {
      throw new UnprocessableEntityException(RefreshTokenMessage.MALFORMED);
    }

    return await this.usersService.findForId(subId);
  }

  private async getStoredTRefreshTokenFromRefreshTokenPayload(
    payload: RefreshTokenPayload,
  ): Promise<RefreshToken | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new UnprocessableEntityException(RefreshTokenMessage.MALFORMED);
    }

    const refreshToken = await this.refreshTokenRepository.findTokenById(
      tokenId,
    );
    if (refreshToken.revoked)
      throw new UnauthorizedException(RefreshTokenMessage.INVALID);
    return refreshToken;
  }
}
