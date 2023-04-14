import { Body, Controller, Post } from '@nestjs/common';
import { LoginRequestDto } from '../../dtos/requests/login/login.request.dto';
import { LogoutRequestDto } from '../../dtos/requests/logout/logout.request.dto';
import { RefreshRequestDto } from '../../dtos/requests/refresh/refresh.request.dto';
import { RegisterRequestDto } from '../../dtos/requests/register/register.request.dto';
import { LoginResponseDto } from '../../dtos/responses/login.response.dto';
import { RefreshResponseDto } from '../../dtos/responses/refresh.response.dto';
import { RegisterResponseDto } from '../../dtos/responses/register.response.dto';
import { SkipAuthentication } from '../../guards/skip-authentication';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @SkipAuthentication()
  @Post('register')
  public register(
    @Body() registerRequestDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerRequestDto);
  }

  @SkipAuthentication()
  // @UseGuards(LocalAuthGuard) // TODO:
  @Post('login')
  public login(
    @Body() loginRequestDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginRequestDto);
  }

  @SkipAuthentication()
  @Post('refresh')
  public refresh(
    @Body() refreshRequestDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refresh(refreshRequestDto.refreshToken);
  }

  @SkipAuthentication()
  @Post('logout')
  public async logout(@Body() logoutRequestDto: LogoutRequestDto) {
    return this.authService.logout(logoutRequestDto.refreshToken);
  }
}
