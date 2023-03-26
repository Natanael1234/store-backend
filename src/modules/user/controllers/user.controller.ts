import { Controller, Post, Get, Body } from '@nestjs/common';
import { Patch } from '@nestjs/common/decorators';
import { Observable } from 'rxjs';
import { CreateUserDTO } from '../dtos/create-user/create-user.dto';
import { UpdateUserDTO } from '../dtos/update-user/update-user.dto';
import { UserEntity } from '../models/user/user.entity';
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
  update(@Body() user: UpdateUserDTO): Promise<UserEntity> {
    return this.userService.update(user);
  }

  @Get()
  findAll(): Promise<UserEntity[]> {
    return this.userService.findAll();
  }
}
