import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt/jwt-auth.guard';
import { LocalAuthGuard } from '../../guards/local/local-auth.guard';
import { SkipAuth } from '../../guards/skip-auth';
import { AuthService } from '../../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipAuth()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  getProfile(@Request() req) {
    // return this.authService.login(req.user);
    return req.user;
  }
}
