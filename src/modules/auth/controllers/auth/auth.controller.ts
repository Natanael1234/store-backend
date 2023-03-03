import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { SkipAuth } from '../../guards/skip-auth';
import { RegisterRequestDto } from '../../dtos/requests/register.request.dto';
import { AuthService } from '../../services/auth/auth.service';
import { LoginRequestDto } from '../../dtos/requests/login.request.dto';
import { RegisterResponseDto } from '../../dtos/responses/register.response.dto';
import { LoginResponseDto } from '../../dtos/responses/login.response.dto';
import { RefreshRequestDto } from '../../dtos/requests/refresh.request.dto';
import { RefreshResponseDto } from '../../dtos/responses/refresh.response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SkipAuth()
  @Post('register')
  public register(
    @Body() registerRequestDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerRequestDto);
  }

  @SkipAuth()
  // @UseGuards(LocalAuthGuard) // TODO:
  @Post('login')
  public login(
    @Body() loginRequestDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginRequestDto);
  }

  @SkipAuth()
  @Post('refresh')
  public refresh(
    @Body() refreshRequestDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refresh(refreshRequestDto);
  }

  @Post('logout')
  public async logout(@Request() req) {
    return this.authService.logout(req.headers.authorization);
  }

  @Get('profile')
  public async getProfile(@Request() req) {
    // return this.authService.login(req.user);
    return req.user;
  }
}
