import { Controller, Post, Get, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt/jwt-auth.guard';
import { UserDTO } from '../models/dtos/user.dto';

import { UserService } from '../services/user/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  add(@Body() user: UserDTO): Observable<UserDTO> {
    return this.userService.add(user);
  }

  @Get()
  findAll(): Observable<UserDTO[]> {
    return this.userService.findAll();
  }
}
