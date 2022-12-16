import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { UserDTO } from '../dtos/user.dto';
import { UserEntity } from '../models/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  add(user: UserDTO): Observable<UserDTO> {
    return from(this.userRepository.save(user));
  }

  findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find());
  }
}
