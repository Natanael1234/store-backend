import { Controller, Post, Get, Body } from '@nestjs/common';
import { Patch, UseGuards } from '@nestjs/common/decorators';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt/jwt-auth.guard';
import { SkipAuth } from 'src/modules/auth/guards/skip-auth';
import { CreateUserDTO } from '../models/dtos/create-user.dto';
import { UpdateUserDTO } from '../models/dtos/update-user.dto';
import { UserEntity } from '../models/user.entity';

import { UserService } from '../services/user/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  register(@Body() user: CreateUserDTO): Promise<boolean> {
    return this.userService.register(user);
  }

  @Post()
  add(@Body() user: CreateUserDTO): Promise<UserEntity> {
    return this.userService.create(user);
  }

  @Patch()
  update(@Body() user: UpdateUserDTO): Observable<UserEntity> {
    return this.userService.update(user);
  }

  @Get()
  findAll(): Observable<UserEntity[]> {
    return this.userService.findAll();
  }
}
