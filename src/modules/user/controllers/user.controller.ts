import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { Param, Req } from '@nestjs/common/decorators';

import { Role } from '../../authentication/enums/role/role.enum';
import { PaginatedResponseDTO } from '../../system/dtos/response/pagination/pagination.response.dto';
import { Roles } from '../decorators/roles/roles.decorator';
import { CreateUserRequestDTO } from '../dtos/request/create-user/create-user.request.dto';
import { FindUserRequestDTO } from '../dtos/request/find-users/find-users.request.dto';
import { UpdatePasswordRequestDTO } from '../dtos/request/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../dtos/request/update-user/update-user.request.dto';
import { UpdatePasswordResponseDTO } from '../dtos/response/update-password/update-password.response.dto';
import { UserEntity } from '../models/user/user.entity';
import { UserService } from '../services/user/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles(Role.ROOT)
  create(@Body() user: CreateUserRequestDTO): Promise<UserEntity> {
    return this.userService.create(user);
  }

  @Patch('/password')
  @Roles(Role.ROOT, Role.ADMIN, Role.USER)
  changePassword(
    @Req() request: { user: UserEntity },
    @Body() passwordDto: UpdatePasswordRequestDTO,
  ): Promise<UpdatePasswordResponseDTO> {
    return this.userService.updatePassword(request.user.id, passwordDto);
  }

  @Get()
  @Roles(Role.ROOT, Role.ADMIN)
  find(
    @Query() findDTO: FindUserRequestDTO,
  ): Promise<PaginatedResponseDTO<UserEntity>> {
    return this.userService.find(findDTO);
  }

  @Patch('/:userId')
  @Roles(Role.ROOT)
  update(
    @Param() params: { userId: number },
    @Body() user: UpdateUserRequestDTO,
  ): Promise<UserEntity> {
    return this.userService.update(params.userId, user);
  }

  @Get('/:userId')
  @Roles(Role.ROOT, Role.ADMIN)
  findForId(@Param() params: { userId: number }): Promise<UserEntity> {
    return this.userService.findForId(params.userId);
  }
}
