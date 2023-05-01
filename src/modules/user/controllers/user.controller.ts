import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Param, Req } from '@nestjs/common/decorators';
import { Role } from '../../authentication/enums/role/role.enum';
import { Roles } from '../decorators/roles/roles.decorator';
import { CreateUserRequestDTO } from '../dtos/create-user/create-user.request.dto';
import { UpdatePasswordResponseDTO } from '../dtos/update-password.response.dto';
import { UpdatePasswordRequestDTO } from '../dtos/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../dtos/update-user/update-user.request.dto';
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

  @Patch('/:userId')
  @Roles(Role.ROOT)
  update(
    @Param() params: { userId: number },
    @Body() user: UpdateUserRequestDTO,
  ): Promise<UserEntity> {
    return this.userService.update(params.userId, user);
  }

  @Get()
  @Roles(Role.ROOT, Role.ADMIN)
  findAll(): Promise<UserEntity[]> {
    return this.userService.findAll();
  }

  @Get('/:userId')
  @Roles(Role.ROOT, Role.ADMIN)
  findForId(@Param() params: { userId: number }): Promise<UserEntity> {
    return this.userService.findForId(params.userId);
  }
}
