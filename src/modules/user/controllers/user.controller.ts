import { Controller, Post, Get, Body } from '@nestjs/common';
import { Param, Patch } from '@nestjs/common/decorators';

import { UpdateUserRequestDTO } from '../dtos/update-user/update-user.request.dto';
import { UserEntity } from '../models/user/user.entity';
import { UserService } from '../services/user/user.service';
import { CreateUserRequestDTO } from '../dtos/create-user/create-user.request.dto';
import { RegisterRequestDto } from '../../auth/dtos/requests/register/register.request.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  add(@Body() user: CreateUserRequestDTO): Promise<UserEntity> {
    return this.userService.create(user);
  }

  @Patch('/:userId')
  update(
    @Param() params: { userId: number },
    @Body() user: UpdateUserRequestDTO,
  ): Promise<UserEntity> {
    return this.userService.update(params.userId, user);
  }

  @Get()
  findAll(): Promise<UserEntity[]> {
    return this.userService.findAll();
  }
}
