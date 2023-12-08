import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { Param, Req, UseInterceptors } from '@nestjs/common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../../../authentication/enums/role/role.enum';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { QueryParamToJsonInterceptor } from '../../../system/interceptors/query-param-to-json/query-param-to-json.interceptor';
import { UuidValidationPipe } from '../../../system/pipes/uuid/uuid-validation.pipe';
import { Roles } from '../../decorators/roles/roles.decorator';
import { CreateUserRequestDTO } from '../../dtos/create-user/create-user.request.dto';
import { FindUserRequestDTO } from '../../dtos/find-users/find-users.request.dto';
import { UpdatePasswordResponseDTO } from '../../dtos/update-password-response/update-password.response.dto';
import { UpdatePasswordRequestDTO } from '../../dtos/update-password/update-password.request.dto';
import { UpdateUserRequestDTO } from '../../dtos/update-user/update-user.request.dto';
import { UserOrder } from '../../enums/sort/user-order/user-order.enum';
import { User } from '../../models/user/user.entity';
import { UserService } from '../../services/user/user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles(Role.ROOT)
  create(@Body() user: CreateUserRequestDTO): Promise<User> {
    return this.userService.create(user);
  }

  @Patch('/password')
  @Roles(Role.ROOT, Role.ADMIN, Role.USER)
  changePassword(
    @Req() request: { user: User },
    @Body() passwordDto: UpdatePasswordRequestDTO,
  ): Promise<UpdatePasswordResponseDTO> {
    return this.userService.updatePassword(request.user.id, passwordDto);
  }

  @Get()
  @Roles(Role.ROOT, Role.ADMIN)
  @UseInterceptors(QueryParamToJsonInterceptor)
  find(
    @Query() findDTO: { query: FindUserRequestDTO },
  ): Promise<PaginatedResponseDTO<User, UserOrder>> {
    return this.userService.find(findDTO.query);
  }

  @Patch('/:userId')
  @Roles(Role.ROOT)
  update(
    @Param('userId', new UuidValidationPipe('user id')) userId: string,
    @Body() user: UpdateUserRequestDTO,
  ): Promise<User> {
    return this.userService.update(userId, user);
  }

  @Get('/:userId')
  @Roles(Role.ROOT, Role.ADMIN)
  findForId(
    @Param('userId', new UuidValidationPipe('user id')) userId: string,
  ): Promise<User> {
    return this.userService.findForId(userId);
  }
}
