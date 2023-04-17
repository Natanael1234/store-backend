import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UnprocessableEntityException } from '@nestjs/common/exceptions';
import { EmailMessage } from '../../../user/enums/email-messages/email-messages.enum';
import { NameMessage } from '../../../user/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../user/enums/password-messages/password-messages.enum';
import { UserMessage } from '../../../user/enums/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { LoginRequestDto } from '../../dtos/requests/login/login.request.dto';
import { RegisterRequestDto } from '../../dtos/requests/register/register.request.dto';
import { AuthenticationPayloadDto } from '../../dtos/responses/authenticationPayload.dto';
import { LoginResponseDto } from '../../dtos/responses/login.response.dto';
import { LogoutResponseDto } from '../../dtos/responses/logout.response.dto';
import { RefreshResponseDto } from '../../dtos/responses/refresh.response.dto';
import { RegisterResponseDto } from '../../dtos/responses/register.response.dto';
import { AccessTokenMessage } from '../../enums/access-token-messages.ts/access-token-messages.enum';
import { CredentialsMessage } from '../../enums/cretentials-messages.ts/credentials-messages.enum';
import { RefreshTokenMessage } from '../../enums/refresh-token-messages.ts/refresh-token-messages.enum';
import { Role } from '../../enums/role/role.enum';
import { TokenService } from '../token/token.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  public async register(
    registerRequestDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    if (!registerRequestDto)
      throw new BadRequestException(UserMessage.DATA_REQUIRED);
    if (!registerRequestDto.password)
      throw new UnprocessableEntityException(PasswordMessage.REQUIRED);
    if (!registerRequestDto.email)
      throw new UnprocessableEntityException(EmailMessage.REQUIRED);
    if (!registerRequestDto.name)
      throw new UnprocessableEntityException(NameMessage.REQUIRED);
    if (!registerRequestDto.password)
      throw new UnprocessableEntityException(PasswordMessage.REQUIRED);

    // TODO: criar uma tabela de configurações para saber se é o cadastro incial ou um método diferente para o cadastro inicial
    const firstUser = !(await this.userService.count());

    const user = await this.userService.create({
      name: registerRequestDto.name,
      email: registerRequestDto.email,
      password: registerRequestDto.password,
      roles: [firstUser ? Role.ROOT : Role.USER],
    });
    const token = await this.tokenService.generateAccessToken(user);
    const refresh = await this.tokenService.generateRefreshToken(user);
    const payload = this.buildResponsePayload(user, token, refresh);
    return { status: 'success', data: payload };
  }

  public async login(
    loginRequestDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    if (!loginRequestDto)
      throw new BadRequestException(CredentialsMessage.REQUIRED);
    if (!loginRequestDto.email)
      throw new UnprocessableEntityException(EmailMessage.REQUIRED);
    if (!loginRequestDto.password)
      throw new UnprocessableEntityException(PasswordMessage.REQUIRED);
    const user = await this.userService.validateCredentials(
      loginRequestDto.email,
      loginRequestDto.password,
    );
    if (!user) {
      throw new UnauthorizedException(CredentialsMessage.INVALID);
    }

    const token = await this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);

    const payload = this.buildResponsePayload(user, token, refreshToken);

    return { status: 'success', data: payload };
  }

  public async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    const { user, token } =
      await this.tokenService.createAccessTokenFromRefreshToken(refreshToken);
    const payload = this.buildResponsePayload(user, token);
    return { status: 'success', data: payload };
  }

  public async logout(refreshToken: string): Promise<LogoutResponseDto> {
    // TODO: pegar os dados de refresh token da sessão.
    if (refreshToken) new ForbiddenException(RefreshTokenMessage.REQUIRED);

    // TODO: schedule revoked tokens removal
    await this.tokenService.revokeRefreshToken(refreshToken);

    // add bearer token to blacklist
    // await this.cachingService.setValue(bearerToken, token); // TODO: add ttl
    return { status: 'success' };
  }

  private buildResponsePayload(
    user: UserEntity,
    accessToken: string,
    refreshToken?: string,
  ): AuthenticationPayloadDto {
    if (!user) throw new UnprocessableEntityException(UserMessage.REQUIRED);
    if (!user.id)
      throw new UnprocessableEntityException(UserMessage.ID_REQUIRED);
    if (!accessToken)
      throw new UnprocessableEntityException(AccessTokenMessage.REQUIRED);
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
