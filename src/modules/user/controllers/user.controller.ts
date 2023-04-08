import { Body, Controller, Get, Post } from '@nestjs/common';
import { Param, Patch } from '@nestjs/common/decorators';
import { CreateUserRequestDTO } from '../dtos/create-user/create-user.request.dto';
import { UpdateUserRequestDTO } from '../dtos/update-user/update-user.request.dto';
import { UserEntity } from '../models/user/user.entity';
import { UserService } from '../services/user/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() user: CreateUserRequestDTO): Promise<UserEntity> {
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

  @Get('/:userId')
  findForId(@Param() params: { userId: number }): Promise<UserEntity> {
    return this.userService.findForId(params.userId);
  }
}
