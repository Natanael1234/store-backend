import { Controller, Post, Get, Body } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserDTO } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  add(@Body() user: UserDTO): Observable<UserDTO> {
    return this.userService.add(user);
  }

  @Get()
  findAll(): Observable<UserDTO[]> {
    return this.userService.findAll();
  }
}
